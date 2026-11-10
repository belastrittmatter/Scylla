import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { project, team, teamMember } from "@/db/schema";
import { TeamService } from "@/services";
import { roleInTeam } from "@/services/team/team-summaries";

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

/** Teams the user belongs to, with role and counts (3 queries, no row loading). */
export async function loadTeamSummaries(userId: string) {
  const rows = await db
    .select({ team, role: teamMember.role })
    .from(teamMember)
    .innerJoin(team, eq(teamMember.teamId, team.id))
    .where(eq(teamMember.userId, userId));
  const ids = rows.map((r) => r.team.id);
  if (ids.length === 0) return [];
  const [members, projects] = await Promise.all([
    db
      .select({ teamId: teamMember.teamId, n: count() })
      .from(teamMember)
      .where(inArray(teamMember.teamId, ids))
      .groupBy(teamMember.teamId),
    db
      .select({ teamId: project.teamId, n: count() })
      .from(project)
      .where(inArray(project.teamId, ids))
      .groupBy(project.teamId),
  ]);
  const countOf = (list: { teamId: string; n: number }[], id: string) =>
    list.find((c) => c.teamId === id)?.n ?? 0;
  return rows.map(({ team: t, role }) => ({
    ...t,
    role: roleInTeam(
      { ownerId: t.ownerId, members: [{ userId, role }] },
      userId,
    ),
    memberCount: countOf(members, t.id),
    projectCount: countOf(projects, t.id),
  }));
}

/** Team by slug/id, only if `userId` is a member; role is authoritative for UI gating. */
export async function loadTeamForMember(slugOrId: string, userId: string) {
  const found =
    (await TeamService.getTeamById(slugOrId)) ??
    (await TeamService.getTeamBySlug(slugOrId));
  if (!found) return null;
  const role = roleInTeam(found, userId);
  if (!role) return null;
  const { members, ...rest } = found;
  return { team: { ...rest, role, memberCount: members.length }, role };
}
