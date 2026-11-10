import { TeamService } from "@/services/team/team-service";
import { ProjectService } from "@/services/project/project-service";
import { hasTeamRole, type TeamWithMembers } from "@/services/team/team-types";
import type { Project } from "@/db/schema";
import { db, user } from "@/db";
import { eq } from "drizzle-orm";
import type { McpToolContext } from "../types";

export async function resolveTeamAndVerifyAccess(
  teamIdOrSlug: string,
  userId: string,
  requiredRole?: "owner" | "admin" | "member" | "viewer",
): Promise<TeamWithMembers> {
  // Same resolution as Server Actions: exact id wins, then slug; callers act on the returned team.id.
  const teamId = await TeamService.resolveTeamId(teamIdOrSlug);
  const matched = teamId ? await TeamService.getTeamById(teamId) : null;

  if (!matched) {
    throw new Error(`Team '${teamIdOrSlug}' not found.`);
  }

  const isOwner = matched.ownerId === userId;
  const member = matched.members?.find((m) => m.userId === userId);

  if (!isOwner && !member) {
    throw new Error(
      `Access denied to team '${teamIdOrSlug}'. Caller is not a member.`,
    );
  }

  // "owner" stays tied to team.ownerId (team deletion), matching REST.
  if (requiredRole === "owner" && !isOwner) {
    throw new Error(
      `Permission denied: Only the team owner can perform this operation.`,
    );
  }

  const role = isOwner ? "owner" : member?.role;
  if (requiredRole === "admin" && !hasTeamRole(role, "admin")) {
    throw new Error(`Permission denied: Team owner or admin role required.`);
  }

  if (requiredRole === "member" && !hasTeamRole(role, "member")) {
    throw new Error(
      `Permission denied: Member or higher role required, viewer is read-only.`,
    );
  }

  return matched;
}

export async function resolveUserId(
  input: string | undefined | null,
  currentUserId: string,
  ctx: McpToolContext,
): Promise<string | null> {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === "me") return currentUserId;

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, trimmed),
  });
  if (existingUser) return existingUser.id;

  const emailOrName = await ctx.resolveAttendeeEmail(trimmed);
  if (emailOrName) {
    const foundUser = await db.query.user.findFirst({
      where: eq(user.email, emailOrName),
    });
    if (foundUser) return foundUser.id;
  }

  if (emailOrName !== trimmed) {
    const foundByEmail = await db.query.user.findFirst({
      where: eq(user.email, trimmed),
    });
    if (foundByEmail) return foundByEmail.id;
  }

  return null;
}

export async function resolveProject(
  projectIdOrSlug: string | undefined | null,
  userId?: string,
  teamId?: string,
): Promise<Project | null> {
  if (!projectIdOrSlug) return null;
  const trimmed = projectIdOrSlug.trim();
  if (!trimmed) return null;

  // 1. Try direct ID lookup (and slug within teamId if provided, in parallel)
  const [byId, byTeamSlug] = await Promise.all([
    ProjectService.getProjectById(trimmed),
    teamId
      ? ProjectService.getProjectBySlug(teamId, trimmed)
      : Promise.resolve(null),
  ]);
  if (byId) {
    if (userId) {
      const isMember = await TeamService.isTeamMember(byId.teamId, userId);
      if (!isMember) return null;
    }
    return byId;
  }
  if (byTeamSlug) {
    if (userId) {
      const isMember = await TeamService.isTeamMember(
        byTeamSlug.teamId,
        userId,
      );
      if (!isMember) return null;
    }
    return byTeamSlug;
  }

  // 2. Try lookup across user's teams if userId is provided
  if (userId) {
    const userTeams = await TeamService.listUserTeams(userId);
    const teamProjects = await Promise.all(
      userTeams.map((t) => ProjectService.getProjectBySlug(t.id, trimmed)),
    );
    const matched = teamProjects.find(Boolean);
    if (matched) return matched;
  }

  return null;
}

export class InsufficientScopeError extends Error {
  readonly code = "insufficient_scope";
  readonly requiredScope: string;

  constructor(requiredScope: string, message?: string) {
    super(
      message ??
        `Insufficient scope: required capability or scope '${requiredScope}' is missing.`,
    );
    this.name = "InsufficientScopeError";
    this.requiredScope = requiredScope;
  }
}

export function enforceToolScope(
  ctx: McpToolContext,
  requiredScope: string,
): void {
  ctx.assertScope(requiredScope);
}

export function verifyScope(ctx: McpToolContext, requiredScope: string) {
  if (!ctx.hasScope(requiredScope)) {
    return {
      isError: true,
      code: "insufficient_scope",
      requiredScope,
      structuredContent: {
        code: "insufficient_scope",
        required_scope: requiredScope,
        message: `Access denied. Missing required capability or scope '${requiredScope}'.`,
      },
      content: [
        {
          type: "text" as const,
          text: `Error [insufficient_scope]: Access denied. Missing required capability or scope '${requiredScope}'.`,
        },
      ],
    };
  }
  return null;
}

export function formatToolSuccess(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function formatToolError(err: unknown) {
  if (
    err instanceof InsufficientScopeError ||
    (err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "insufficient_scope")
  ) {
    const requiredScope =
      "requiredScope" in (err as Record<string, unknown>)
        ? String((err as Record<string, unknown>).requiredScope)
        : undefined;
    const message = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      code: "insufficient_scope",
      ...(requiredScope ? { requiredScope } : {}),
      structuredContent: {
        code: "insufficient_scope",
        ...(requiredScope ? { required_scope: requiredScope } : {}),
        message,
      },
      content: [
        {
          type: "text" as const,
          text: `Error [insufficient_scope]: ${message}`,
        },
      ],
    };
  }
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: `Error: ${message}`,
      },
    ],
  };
}
