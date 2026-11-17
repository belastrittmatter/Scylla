import { eq } from "drizzle-orm";
import { db } from "@/db";
import { team, teamMember } from "@/db/schema";
import { parseGithubRepoFullName } from "@/lib/github-validation";
import { GithubAuthService } from "./github-auth-service";
import { jsonInit } from "./github-task-context";

export async function inviteCollaborator(
  repoFullName: string,
  githubLogin: string,
  userId?: string,
): Promise<boolean> {
  const parsed = parseGithubRepoFullName(repoFullName);
  if (!parsed) return false;
  try {
    const res = await GithubAuthService.fetchWithAuth(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/collaborators/${encodeURIComponent(githubLogin)}`,
      jsonInit("PUT", { permission: "push" }),
      userId,
    );
    if (res.status !== 201 && res.status !== 204) {
      console.warn(`GitHub collaborator invite failed: ${res.status}`);
    }
    return res.status === 201 || res.status === 204;
  } catch (error) {
    console.warn("GitHub collaborator invite failed", error);
    return false;
  }
}

export async function inviteTeamCollaborators(
  teamId: string,
  repoFullName: string,
  userId?: string,
): Promise<{ invited: string[]; skipped: string[] }> {
  const [owner] = await db
    .select({ id: team.ownerId })
    .from(team)
    .where(eq(team.id, teamId));
  const members = await db
    .select({ id: teamMember.userId })
    .from(teamMember)
    .where(eq(teamMember.teamId, teamId));
  const ids = new Set([
    ...(owner ? [owner.id] : []),
    ...members.map((m) => m.id),
  ]);
  if (userId) ids.delete(userId);

  const invited: string[] = [];
  const skipped: string[] = [];
  for (const id of ids) {
    const login = await GithubAuthService.getGithubLogin(id);
    const ok = login
      ? await inviteCollaborator(repoFullName, login, userId)
      : false;
    (ok ? invited : skipped).push(id);
  }
  return { invited, skipped };
}
