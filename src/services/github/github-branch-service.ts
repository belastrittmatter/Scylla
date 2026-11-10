import { db } from "@/db";
import { task, project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GithubAuthService } from "./github-auth-service";
import {
  type CreateBranchResult,
  generateBranchName,
} from "./github-dev-utils";
import { GithubIssueService } from "./github-issue-service";

export class GithubBranchService {
  /**
   * Creates a branch directly on GitHub for a task and transitions task to in_progress.
   */
  public static async createBranchForTask(
    taskId: string,
    customBranchName?: string,
    userId?: string,
  ): Promise<CreateBranchResult> {
    const [taskRecord] = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);

    if (!taskRecord) {
      throw new Error(`Task "${taskId}" not found`);
    }

    if (!taskRecord.projectId) {
      throw new Error("Task is not assigned to any project");
    }

    const [projectRecord] = await db
      .select()
      .from(project)
      .where(eq(project.id, taskRecord.projectId))
      .limit(1);

    if (!projectRecord?.githubRepo?.trim()) {
      throw new Error("Project is not linked to any GitHub repository");
    }

    const [owner, repo] = projectRecord.githubRepo.trim().split("/");
    const targetUserId = userId || taskRecord.creatorId;
    const token = await GithubAuthService.resolveToken(targetUserId);
    if (!token) {
      throw new Error(
        "No GitHub access token found. Please connect your GitHub account in Settings.",
      );
    }

    // 1. Ensure issue exists on GitHub so the branch can be linked directly to it
    let issueNumber = taskRecord.githubIssueNumber;
    if (!issueNumber) {
      try {
        const createdIssue = await GithubIssueService.createIssueForTask(
          taskId,
          targetUserId,
        );
        if (createdIssue) {
          issueNumber = createdIssue.number;
        }
      } catch (err) {
        console.warn("Could not auto-create issue before branching:", err);
      }
    }

    const branchName =
      customBranchName?.trim() ||
      taskRecord.githubBranch ||
      generateBranchName(issueNumber, taskRecord.title);

    // 2. Get default branch & repository node_id
    const repoRes = await GithubAuthService.fetchWithAuth(
      `https://api.github.com/repos/${owner}/${repo}`,
      {},
      targetUserId,
    );
    if (!repoRes.ok) {
      throw new Error(`Failed to get repository info: ${repoRes.statusText}`);
    }
    const repoData = (await repoRes.json()) as {
      default_branch?: string;
      node_id?: string;
    };
    const defaultBranch = repoData.default_branch || "main";
    const repoNodeId = repoData.node_id;

    // 3. Get commit SHA of the default branch
    const refRes = await GithubAuthService.fetchWithAuth(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`,
      {},
      targetUserId,
    );
    if (!refRes.ok) {
      throw new Error(`Failed to get default branch ref: ${refRes.statusText}`);
    }
    const refData = (await refRes.json()) as { object?: { sha?: string } };
    const baseSha = refData.object?.sha;
    if (!baseSha) {
      throw new Error("Could not find commit SHA for default branch");
    }

    // 4. Create branch and link to GitHub issue
    let alreadyExisted = false;
    let linkedViaGraphql = false;

    // Attempt GitHub GraphQL createLinkedBranch mutation
    if (issueNumber && repoNodeId) {
      try {
        const issueRes = await GithubAuthService.fetchWithAuth(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
          {},
          targetUserId,
        );
        if (issueRes.ok) {
          const issueData = (await issueRes.json()) as { node_id?: string };
          if (issueData.node_id) {
            const gqlRes = await GithubAuthService.fetchWithAuth(
              "https://api.github.com/graphql",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  query: `
                    mutation CreateLinkedBranch($input: CreateLinkedBranchInput!) {
                      createLinkedBranch(input: $input) {
                        linkedBranch {
                          id
                          ref {
                            name
                          }
                        }
                      }
                    }
                  `,
                  variables: {
                    input: {
                      issueId: issueData.node_id,
                      repositoryId: repoNodeId,
                      name: branchName,
                      oid: baseSha,
                    },
                  },
                }),
              },
              targetUserId,
            );

            if (gqlRes.ok) {
              const gqlJson = (await gqlRes.json()) as {
                data?: { createLinkedBranch?: { linkedBranch?: unknown } };
                errors?: Array<{ message?: string }>;
              };

              if (gqlJson.data?.createLinkedBranch?.linkedBranch) {
                linkedViaGraphql = true;
              } else if (gqlJson.errors && gqlJson.errors.length > 0) {
                const errMsg = gqlJson.errors
                  .map((e) => e.message || "")
                  .join(" ");
                if (
                  errMsg.toLowerCase().includes("already exists") ||
                  errMsg.toLowerCase().includes("ref already exists")
                ) {
                  alreadyExisted = true;
                  linkedViaGraphql = true;
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn(
          "GraphQL createLinkedBranch failed, falling back to REST ref:",
          err,
        );
      }
    }

    // Fallback: If not linked via GraphQL, create ref via standard GitHub Git REST API
    if (!linkedViaGraphql) {
      const createRefRes = await GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repo}/git/refs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: baseSha,
          }),
        },
        targetUserId,
      );

      if (!createRefRes.ok) {
        if (createRefRes.status === 422) {
          alreadyExisted = true;
        } else {
          const errBody = await createRefRes.text().catch(() => "");
          throw new Error(`Failed to create branch: ${errBody}`);
        }
      }
    }

    // 5. Post comment linking the branch to the issue on GitHub if issue exists
    if (issueNumber) {
      try {
        const branchUrl = `https://github.com/${owner}/${repo}/tree/${encodeURIComponent(branchName)}`;
        await GithubAuthService.fetchWithAuth(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              body: `🌿 **Development Branch:** [\`${branchName}\`](${branchUrl})`,
            }),
          },
          targetUserId,
        );
      } catch {
        // Non-critical, ignore comment failure
      }
    }

    // 6. Update task record: store branch name, and Jira automation: move from 'todo' to 'in_progress'
    if (taskRecord.status === "todo") {
      try {
        const { TaskService } = await import("@/services/task/task-service");
        await TaskService.updateTask(
          taskId,
          { status: "in_progress" },
          targetUserId,
        );
      } catch (err) {
        console.warn("Could not start task session via TaskService:", err);
      }
    }

    await db
      .update(task)
      .set({
        githubBranch: branchName,
        githubIssueNumber: issueNumber ?? taskRecord.githubIssueNumber,
        ...(taskRecord.status === "todo" ? { status: "in_progress" } : {}),
      })
      .where(eq(task.id, taskId));

    return {
      branchName,
      alreadyExisted,
      checkoutCommand: `git checkout -b ${branchName}`,
      issueNumber,
      linkedToIssue: Boolean(issueNumber),
    };
  }
}
