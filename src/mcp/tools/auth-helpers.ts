import { TeamService } from "@/services/team/team-service";
import { ProjectService } from "@/services/project/project-service";
import type { TeamWithMembers } from "@/services/team/team-types";
import type { Project } from "@/db/schema";
import { db, user, project } from "@/db";
import { eq } from "drizzle-orm";
import type { McpToolContext } from "../types";

export async function resolveTeamAndVerifyAccess(
  teamIdOrSlug: string,
  userId: string,
  requiredRole?: "owner" | "admin" | "member",
): Promise<TeamWithMembers> {
  const [byId, bySlug] = await Promise.all([
    TeamService.getTeamById(teamIdOrSlug),
    TeamService.getTeamBySlug(teamIdOrSlug),
  ]);
  const matched = byId || bySlug;

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

  if (requiredRole === "owner" && !isOwner) {
    throw new Error(
      `Permission denied: Only the team owner can perform this operation.`,
    );
  }

  if (
    requiredRole === "admin" &&
    !isOwner &&
    member?.role !== "admin" &&
    member?.role !== "owner"
  ) {
    throw new Error(`Permission denied: Team owner or admin role required.`);
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
  if (byId) return byId;
  if (byTeamSlug) return byTeamSlug;

  // 2. Try lookup across user's teams if userId is provided
  if (userId) {
    const userTeams = await TeamService.listUserTeams(userId);
    const teamProjects = await Promise.all(
      userTeams.map((t) => ProjectService.getProjectBySlug(t.id, trimmed)),
    );
    const matched = teamProjects.find(Boolean);
    if (matched) return matched;
  }

  // 4. Fallback search by slug across all projects
  const foundBySlug = await db.query.project.findFirst({
    where: eq(project.slug, trimmed),
  });
  return foundBySlug ?? null;
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
