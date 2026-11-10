import { db } from "@/db";
import { user, account, teamMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { GithubAuthService } from "./github-auth-service";

export class GithubUserResolver {
  /**
   * Resolves a Scylla user's GitHub username from email, account link, or GitHub API.
   */
  public static async resolveGitHubUsername(
    targetUserId: string,
    authUserId?: string,
  ): Promise<string | null> {
    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (!targetUser) return null;

    if (targetUser.email?.endsWith("@users.noreply.github.com")) {
      return targetUser.email.replace("@users.noreply.github.com", "");
    }

    const [userAcc] = await db
      .select()
      .from(account)
      .where(
        and(eq(account.userId, targetUserId), eq(account.providerId, "github")),
      )
      .limit(1);

    if (userAcc) {
      if (userAcc.accessToken) {
        try {
          const res = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${userAcc.accessToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          });
          if (res.ok) {
            const data = (await res.json()) as { login?: string };
            if (data?.login) return data.login;
          }
        } catch {
          // ignore error and fallback
        }
      }

      if (userAcc.accountId) {
        if (/^\d+$/.test(userAcc.accountId)) {
          try {
            const res = await GithubAuthService.fetchWithAuth(
              `https://api.github.com/user/${userAcc.accountId}`,
              {},
              authUserId || targetUserId,
            );
            if (res.ok) {
              const data = (await res.json()) as { login?: string };
              if (data?.login) return data.login;
            }
          } catch {
            // ignore error and fallback
          }
        } else {
          return userAcc.accountId;
        }
      }
    }

    if (
      targetUser.name &&
      !targetUser.name.includes(" ") &&
      /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(
        targetUser.name,
      )
    ) {
      return targetUser.name;
    }

    return null;
  }

  /**
   * Invites a user as a collaborator to a repository with push permissions.
   */
  public static async inviteCollaborator(
    owner: string,
    repo: string,
    username: string,
    authUserId?: string,
  ): Promise<boolean> {
    const cleanUser = username.trim();
    if (
      !cleanUser ||
      cleanUser.includes(" ") ||
      cleanUser.toLowerCase() === owner.toLowerCase()
    ) {
      return false;
    }

    try {
      const res = await GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repo}/collaborators/${cleanUser}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permission: "push",
          }),
        },
        authUserId,
      );

      return res.status === 201 || res.status === 204;
    } catch (err) {
      console.warn(
        `Error inviting collaborator ${cleanUser} to ${owner}/${repo}:`,
        err,
      );
      return false;
    }
  }

  /**
   * Invites all team members of a team as collaborators to the GitHub repository.
   */
  public static async inviteTeamCollaborators(
    teamId: string,
    githubRepo: string,
    inviterUserId?: string,
  ): Promise<{ invited: string[]; skipped: string[] }> {
    const parts = githubRepo.trim().split("/");
    if (parts.length !== 2) return { invited: [], skipped: [] };
    const [owner, repo] = parts;

    const members = await db
      .select({ userId: teamMember.userId })
      .from(teamMember)
      .where(eq(teamMember.teamId, teamId));

    const invited: string[] = [];
    const skipped: string[] = [];

    for (const member of members) {
      if (inviterUserId && member.userId === inviterUserId) continue;

      const ghUsername = await this.resolveGitHubUsername(
        member.userId,
        inviterUserId,
      );
      if (!ghUsername) {
        skipped.push(member.userId);
        continue;
      }

      if (ghUsername.toLowerCase() === owner.toLowerCase()) {
        continue;
      }

      try {
        const ok = await this.inviteCollaborator(
          owner,
          repo,
          ghUsername,
          inviterUserId,
        );
        if (ok) {
          invited.push(ghUsername);
        } else {
          skipped.push(ghUsername);
        }
      } catch {
        skipped.push(ghUsername);
      }
    }

    return { invited, skipped };
  }
}
