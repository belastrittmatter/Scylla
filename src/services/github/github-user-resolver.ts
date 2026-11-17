import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { account, teamMember } from "@/db/schema";
import { parseGithubRepo } from "@/lib/github-validation";
import {
  GITHUB_API_URL,
  GithubAuthService,
} from "@/services/github/github-auth-service";

export class GithubUserResolver {
  /** The GitHub login of a user's linked account, or null when unknown. */
  static async resolveGitHubUsername(
    targetUserId: string,
    authUserId?: string,
  ): Promise<string | null> {
    const [row] = await db
      .select({ accountId: account.accountId })
      .from(account)
      .where(
        and(eq(account.userId, targetUserId), eq(account.providerId, "github")),
      )
      .limit(1);
    if (!row) return null;
    if (!/^\d+$/.test(row.accountId)) return row.accountId;

    try {
      const res = await GithubAuthService.fetchWithAuth(
        `${GITHUB_API_URL}/user/${row.accountId}`,
        {},
        authUserId ?? targetUserId,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { login?: string };
      return data.login ?? null;
    } catch (err) {
      console.warn("Could not resolve GitHub username:", err);
      return null;
    }
  }

  static async inviteCollaborator(
    owner: string,
    repo: string,
    username: string,
    authUserId?: string,
  ): Promise<boolean> {
    const login = username.trim();
    if (
      !login ||
      /\s/.test(login) ||
      login.toLowerCase() === owner.toLowerCase()
    ) {
      return false;
    }
    try {
      const res = await GithubAuthService.fetchWithAuth(
        `${GITHUB_API_URL}/repos/${owner}/${repo}/collaborators/${login}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permission: "push" }),
        },
        authUserId,
      );
      return res.status === 201 || res.status === 204;
    } catch (err) {
      console.warn("Could not invite GitHub collaborator:", err);
      return false;
    }
  }

  static async inviteTeamCollaborators(
    teamId: string,
    githubRepo: string,
    inviterUserId?: string,
  ): Promise<{ invited: string[]; skipped: string[] }> {
    const result: { invited: string[]; skipped: string[] } = {
      invited: [],
      skipped: [],
    };
    const parsed = parseGithubRepo(githubRepo);
    if (!parsed) return result;

    const members = await db
      .select({ userId: teamMember.userId })
      .from(teamMember)
      .where(
        inviterUserId
          ? and(
              eq(teamMember.teamId, teamId),
              ne(teamMember.userId, inviterUserId),
            )
          : eq(teamMember.teamId, teamId),
      );

    for (const { userId } of members) {
      const login = await GithubUserResolver.resolveGitHubUsername(
        userId,
        inviterUserId,
      );
      if (!login) {
        result.skipped.push(userId);
      } else if (login.toLowerCase() === parsed.owner.toLowerCase()) {
        continue;
      } else if (
        await GithubUserResolver.inviteCollaborator(
          parsed.owner,
          parsed.repo,
          login,
          inviterUserId,
        )
      ) {
        result.invited.push(login);
      } else {
        result.skipped.push(login);
      }
    }
    return result;
  }
}
