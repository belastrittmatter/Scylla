import { db } from "@/db";
import { task, project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GithubAuthService } from "./github-auth-service";
import { GithubUserResolver } from "./github-user-resolver";

export class GithubIssueAssigneeService {
  /**
   * Updates assignee on the linked GitHub Issue.
   */
  public static async updateIssueAssignee(
    taskId: string,
    newAssigneeId: string | null,
    userId?: string,
  ): Promise<boolean> {
    const [taskRecord] = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);

    if (!taskRecord?.githubIssueNumber || !taskRecord.projectId) return false;

    const [projectRecord] = await db
      .select()
      .from(project)
      .where(eq(project.id, taskRecord.projectId))
      .limit(1);

    if (!projectRecord?.githubRepo?.trim()) return false;

    const [owner, repo] = projectRecord.githubRepo.trim().split("/");
    const targetUserId = userId || taskRecord.creatorId;
    const token = await GithubAuthService.resolveToken(targetUserId);
    if (!token) return false;

    let targetGhUsername: string | null = null;
    if (newAssigneeId) {
      targetGhUsername = await GithubUserResolver.resolveGitHubUsername(
        newAssigneeId,
        targetUserId,
      );
    }

    try {
      const getIssueRes = await GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repo}/issues/${taskRecord.githubIssueNumber}`,
        {},
        targetUserId,
      );

      let currentAssignees: string[] = [];
      if (getIssueRes.ok) {
        const issueData = (await getIssueRes.json()) as {
          assignees?: Array<{ login: string }>;
        };
        currentAssignees = (issueData.assignees || []).map((a) => a.login);
      }

      if (currentAssignees.length > 0) {
        await GithubAuthService.fetchWithAuth(
          `https://api.github.com/repos/${owner}/${repo}/issues/${taskRecord.githubIssueNumber}/assignees`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignees: currentAssignees }),
          },
          targetUserId,
        );
      }

      if (targetGhUsername) {
        await GithubUserResolver.inviteCollaborator(
          owner,
          repo,
          targetGhUsername,
          targetUserId,
        );

        const addRes = await GithubAuthService.fetchWithAuth(
          `https://api.github.com/repos/${owner}/${repo}/issues/${taskRecord.githubIssueNumber}/assignees`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignees: [targetGhUsername] }),
          },
          targetUserId,
        );
        return addRes.ok;
      }

      return true;
    } catch (e) {
      console.warn("Failed to update GitHub issue assignees:", e);
      return false;
    }
  }
}
