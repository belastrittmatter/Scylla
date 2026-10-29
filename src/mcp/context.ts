import { GoogleCalendarService } from "@/services/google-calendar";
import { UserService } from "@/services/user";
import { db } from "@/db";
import { account, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { McpToolContext, McpUser } from "./types";

export function createMcpToolContext(userId?: string): McpToolContext {
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
        }
        return await GoogleCalendarService.getAccessToken();
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
        try {
          const fallbackUsers = await db.select().from(user).limit(1);
          if (fallbackUsers.length > 0) return fallbackUsers[0];
        } catch (err) {
          console.warn("Could not query fallback users:", err);
        }
        return {
          id: "usr_me",
          name: "Me (Organizer)",
          email: "me@example.com",
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
    getAccessToken,
    getCurrentUser,
    resolveAttendeeEmail,
  };
}
