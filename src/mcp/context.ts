import { GoogleCalendarService } from "@/services/google-calendar";
import { UserService } from "@/services/user";
import { db } from "@/db";
import { account, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { McpToolContext, McpUser } from "./types";
import { InsufficientScopeError } from "./tools/auth-helpers";

export function isScopeSatisfied(
  grantedScopes: ReadonlySet<string> | undefined,
  requiredScope: string,
): boolean {
  if (!grantedScopes || grantedScopes.size === 0) {
    return false; // Fail-closed: empty or undefined scopes grant no permissions
  }
  if (grantedScopes.has("*") || grantedScopes.has("all")) {
    return true;
  }
  const req = requiredScope.trim().toLowerCase();
  if (grantedScopes.has(req)) {
    return true;
  }

  // Domain wildcard: "tasks.*" grants "tasks.readonly", "tasks.write", "tasks.delete"
  const prefix = req.includes(".") ? req.split(".")[0] : req;
  if (grantedScopes.has(`${prefix}.*`)) {
    return true;
  }

  // Bare domain name: "tasks" grants read and write, but NOT destructive delete
  if (grantedScopes.has(prefix)) {
    if (req.endsWith(".delete")) {
      return false;
    }
    return true;
  }

  // Hierarchical rules:
  // Write implies Read (destructive deletions always require explicit .delete scope)
  if (req === "calendar.readonly" && grantedScopes.has("calendar.events")) {
    return true;
  }
  if (
    req === "tasks.readonly" &&
    (grantedScopes.has("tasks.write") || grantedScopes.has("tasks.delete"))
  ) {
    return true;
  }
  if (
    (req === "teams.readonly" || req === "teams.read") &&
    (grantedScopes.has("teams.manage") || grantedScopes.has("teams.delete"))
  ) {
    return true;
  }
  if (
    (req === "projects.readonly" || req === "projects.read") &&
    (grantedScopes.has("projects.manage") ||
      grantedScopes.has("projects.delete"))
  ) {
    return true;
  }

  return false;
}

function normalizeScopes(input?: unknown): {
  scopesList?: readonly string[];
  scopeSet?: Set<string>;
} {
  if (input === undefined || input === null) {
    return {};
  }

  let list: string[] = [];
  if (Array.isArray(input)) {
    list = input
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  } else if (typeof input === "string") {
    list = input
      .split(/[\s,]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  return {
    scopesList: list,
    scopeSet: new Set(list),
  };
}

export function createMcpToolContext(
  userId?: string,
  rawScopes?: unknown,
  agentId?: string,
): McpToolContext {
  const { scopesList, scopeSet } = normalizeScopes(rawScopes);

  const hasScope = (requiredScope: string): boolean => {
    return isScopeSatisfied(scopeSet, requiredScope);
  };

  const assertScope = (requiredScope: string): void => {
    if (!hasScope(requiredScope)) {
      throw new InsufficientScopeError(requiredScope);
    }
  };

  let accessTokenPromise: Promise<string | null> | null = null;
  let currentUserPromise: Promise<McpUser> | null = null;

  const getAccessToken = (): Promise<string | null> => {
    if (!accessTokenPromise) {
      accessTokenPromise = (async () => {
        if (userId) {
          try {
            const userAccounts = await db
              .select()
              .from(account)
              .where(
                and(
                  eq(account.userId, userId),
                  eq(account.providerId, "google"),
                ),
              )
              .limit(1);

            if (userAccounts.length > 0) {
              const refreshedToken =
                await GoogleCalendarService.refreshAccountToken(
                  userAccounts[0],
                );
              if (refreshedToken) return refreshedToken;
            }
          } catch (err) {
            console.warn("Could not query Google account for user:", err);
          }
          // In mock/test mode, allow mock token. In production, never leak server-wide global Google token if user has no linked Google account.
          if (GoogleCalendarService.isMockMode()) {
            return "mock-access-token";
          }
          return null;
        }
        if (GoogleCalendarService.isMockMode()) {
          return "mock-access-token";
        }
        return null;
      })();
    }
    return accessTokenPromise;
  };

  const getCurrentUser = (): Promise<McpUser> => {
    if (!currentUserPromise) {
      currentUserPromise = (async () => {
        if (userId) {
          try {
            const users = await db
              .select()
              .from(user)
              .where(eq(user.id, userId))
              .limit(1);
            if (users.length > 0) return users[0];
          } catch (err) {
            console.warn("Could not query user by id:", err);
          }
        }
        // Never fall back to the first user in the database (prevents multi-tenant identity spoofing).
        return {
          id: userId || "usr_unauthenticated",
          name: "Unauthenticated User",
          email: "unauthenticated@example.com",
          image: null,
        };
      })();
    }
    return currentUserPromise;
  };

  const resolveAttendeeEmail = async (
    attendeeOrQuery: string,
    token?: string | null,
  ): Promise<string> => {
    const trimmed = attendeeOrQuery.trim();
    if (!trimmed) return "";
    const lower = trimmed.toLowerCase();
    if (lower === "me" || lower === "self" || lower === "myself") {
      const current = await getCurrentUser();
      return (current.email || "").toLowerCase();
    }
    if (trimmed.includes("@")) return lower;
    try {
      const current = await getCurrentUser();
      if (
        current.name &&
        current.name.toLowerCase() === lower &&
        current.email
      ) {
        return current.email.toLowerCase();
      }
      const teammates = await UserService.searchTeammates(trimmed, 1, {
        currentUserId: userId ?? "",
        accessToken: token || undefined,
      });
      if (teammates.length > 0 && teammates[0].email) {
        return teammates[0].email.toLowerCase();
      }
    } catch (err) {
      console.warn("Failed resolving teammate nickname:", err);
    }
    return lower;
  };

  return {
    userId,
    agentId,
    scopes: scopesList,
    hasScope,
    assertScope,
    getAccessToken,
    getCurrentUser,
    resolveAttendeeEmail,
  };
}
