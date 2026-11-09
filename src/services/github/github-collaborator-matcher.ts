import { db } from "@/db";
import { account, user, teamMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { GithubAuthService } from "./github-auth-service";
import type { GitHubCollaborator } from "./github-sync-service";

export class GithubCollaboratorMatcher {
  /**
   * Matches collaborators from a GitHub repository to existing Scylla team members.
   * Only existing team members are mapped to prevent syncing outsiders into the team.
   */
  public static async syncCollaborators(
    teamId: string,
    owner: string,
    repo: string,
    token?: string,
    userId?: string,
  ): Promise<Map<string, string>> {
    const memberMap = new Map<string, string>();
    if (!token && !userId) return memberMap;

    try {
      const res = await GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repo}/collaborators?per_page=100`,
        {},
        userId,
      );

      if (!res.ok) {
        console.warn(
          `Could not fetch collaborators from GitHub: ${res.statusText}`,
        );
        return memberMap;
      }

      const collaborators = (await res.json()) as GitHubCollaborator[];
      if (!Array.isArray(collaborators)) return memberMap;

      const existingTeamMembers = await db
        .select({
          userId: teamMember.userId,
          userName: user.name,
          userEmail: user.email,
          githubAccountId: account.accountId,
        })
        .from(teamMember)
        .innerJoin(user, eq(user.id, teamMember.userId))
        .leftJoin(
          account,
          and(eq(account.userId, user.id), eq(account.providerId, "github")),
        )
        .where(eq(teamMember.teamId, teamId));

      for (const collab of collaborators) {
        const loginLower = collab.login.toLowerCase();
        const placeholderEmail = `${loginLower}@users.noreply.github.com`;

        const matched = existingTeamMembers.find(
          (m) =>
            m.githubAccountId === String(collab.id) ||
            m.userEmail.toLowerCase() === placeholderEmail ||
            m.userName.toLowerCase() === loginLower ||
            (m.githubAccountId &&
              m.githubAccountId.toLowerCase() === loginLower),
        );

        if (matched) {
          memberMap.set(loginLower, matched.userId);
        }
      }
    } catch (err) {
      console.warn("Failed to match collaborators from GitHub:", err);
    }

    return memberMap;
  }
}
