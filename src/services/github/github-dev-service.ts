import { db } from "@/db";
import { task, project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GithubAuthService } from "./github-auth-service";
import {
  type TaskDevelopmentInfo,
  generateBranchName,
  isPrLinkedToIssue,
  mapGitHubPrState,
} from "./github-dev-utils";

export class GithubDevService {
  /**
   * Retrieves Jira-style development info (branch, PR, commit reference) for a task.
   */
  public static async getTaskDevelopmentInfo(
    taskId: string,
    userId?: string,
  ): Promise<TaskDevelopmentInfo> {
    const [taskRecord] = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);

    if (!taskRecord) {
      throw new Error(`Task "${taskId}" not found`);
    }

    let repo: string | null = null;
    if (taskRecord.projectId) {
      const [projectRecord] = await db
        .select()
        .from(project)
        .where(eq(project.id, taskRecord.projectId))
        .limit(1);
      repo = projectRecord?.githubRepo || null;
    }

    let branch: string | null = taskRecord.githubBranch;
    let isBranchOnRemote = false;
    const suggestedBranch =
      taskRecord.githubBranch ||
      generateBranchName(taskRecord.githubIssueNumber, taskRecord.title);

    let pullRequest: TaskDevelopmentInfo["pullRequest"] = null;

    if (repo && taskRecord.githubIssueNumber) {
      const targetUserId = userId || taskRecord.creatorId;
      const token = await GithubAuthService.resolveToken(targetUserId);
      if (token) {
        const [owner, repoName] = repo.split("/");

        // Verify if branch exists on GitHub remote repository, or look for existing branch
        if (taskRecord.githubBranch) {
          try {
            const branchCheckRes = await GithubAuthService.fetchWithAuth(
              `https://api.github.com/repos/${owner}/${repoName}/branches/${encodeURIComponent(taskRecord.githubBranch)}`,
              {},
              targetUserId,
            );
            if (branchCheckRes.ok) {
              isBranchOnRemote = true;
            }
          } catch {
            // Keep branch intact
          }
        } else {
          try {
            const branchListRes = await GithubAuthService.fetchWithAuth(
              `https://api.github.com/repos/${owner}/${repoName}/branches?per_page=100`,
              {},
              targetUserId,
            );
            if (branchListRes.ok) {
              const bList = (await branchListRes
                .json()
                .catch(() => [])) as Array<{ name: string }>;
              const matchedB = bList.find((b) => {
                const match = b.name.match(
                  /(?:^|\/|[#\-_])(?:#?)(?:issue[\-_]?)?(\d+)(?:[#\-_]|$)/i,
                );
                return (
                  match &&
                  parseInt(match[1], 10) === taskRecord.githubIssueNumber
                );
              });
              if (matchedB) {
                branch = matchedB.name;
                isBranchOnRemote = true;
                await db
                  .update(task)
                  .set({ githubBranch: matchedB.name })
                  .where(eq(task.id, taskId));
              }
            }
          } catch {
            // non-blocking
          }
        }

        // 1. Try resolving linked PR directly by branch name
        if (branch) {
          try {
            const pullsByBranchRes = await GithubAuthService.fetchWithAuth(
              `https://api.github.com/repos/${owner}/${repoName}/pulls?head=${owner}:${encodeURIComponent(branch)}&state=all`,
              {},
              targetUserId,
            );
            if (pullsByBranchRes.ok) {
              const branchPulls = (await pullsByBranchRes
                .json()
                .catch(() => [])) as Array<{
                number: number;
                html_url: string;
                title: string;
                body?: string | null;
                state: string;
                draft?: boolean;
                merged_at?: string | null;
                head?: { ref?: string };
              }>;
              if (Array.isArray(branchPulls) && branchPulls.length > 0) {
                const match = branchPulls[0];
                pullRequest = {
                  number: match.number,
                  url: match.html_url,
                  title: match.title,
                  state: mapGitHubPrState(match),
                };
              }
            }
          } catch {
            // non-blocking
          }
        }

        // 2. Try resolving linked PR via GitHub Issue Timeline API
        if (!pullRequest) {
          try {
            const timelineRes = await GithubAuthService.fetchWithAuth(
              `https://api.github.com/repos/${owner}/${repoName}/issues/${taskRecord.githubIssueNumber}/timeline?per_page=100`,
              { headers: { Accept: "application/vnd.github.v3+json" } },
              targetUserId,
            );
            if (timelineRes.ok) {
              const events = (await timelineRes
                .json()
                .catch(() => [])) as Array<{
                event: string;
                source?: {
                  type?: string;
                  issue?: {
                    number: number;
                    html_url: string;
                    title: string;
                    state: string;
                    draft?: boolean;
                    pull_request?: { merged_at?: string | null };
                  };
                };
              }>;
              if (Array.isArray(events)) {
                const crossRef = events.find(
                  (e) =>
                    e.event === "cross-referenced" &&
                    e.source?.type === "issue" &&
                    e.source?.issue?.pull_request &&
                    e.source?.issue?.number !== taskRecord.githubIssueNumber,
                );
                if (crossRef?.source?.issue) {
                  const prItem = crossRef.source.issue;
                  pullRequest = {
                    number: prItem.number,
                    url: prItem.html_url,
                    title: prItem.title,
                    state: mapGitHubPrState({
                      merged_at: prItem.pull_request?.merged_at,
                      draft: prItem.draft,
                      state: prItem.state,
                    }),
                  };
                }
              }
            }
          } catch {
            // non-blocking
          }
        }

        // 3. Fallback: Search GitHub PRs referencing "#<issueNumber>"
        if (!pullRequest) {
          try {
            const prRes = await GithubAuthService.fetchWithAuth(
              `https://api.github.com/search/issues?q=repo:${owner}/${repoName}+type:pr+"%23${taskRecord.githubIssueNumber}"`,
              {},
              targetUserId,
            );

            if (prRes.ok) {
              const prData = (await prRes.json()) as {
                items?: Array<{
                  number: number;
                  html_url: string;
                  title: string;
                  body?: string | null;
                  state: string;
                  draft?: boolean;
                  pull_request?: { merged_at?: string | null };
                  head?: { ref?: string };
                }>;
              };

              if (Array.isArray(prData.items)) {
                const matchedPr = prData.items.find((item) =>
                  isPrLinkedToIssue(
                    item,
                    taskRecord.githubIssueNumber!,
                    branch,
                  ),
                );
                if (matchedPr) {
                  pullRequest = {
                    number: matchedPr.number,
                    url: matchedPr.html_url,
                    title: matchedPr.title,
                    state: mapGitHubPrState({
                      merged_at: matchedPr.pull_request?.merged_at,
                      draft: matchedPr.draft,
                      state: matchedPr.state,
                    }),
                  };
                }
              }
            }
          } catch (e) {
            console.warn("Could not query GitHub PR info:", e);
          }
        }

        // 4. Synchronize PR status to task database
        if (pullRequest) {
          if (pullRequest.state === "merged" && taskRecord.status !== "done") {
            const { TaskService } =
              await import("@/services/task/task-service");
            await TaskService.updateTask(
              taskId,
              { status: "done" },
              targetUserId,
            ).catch(console.warn);
          }

          await db
            .update(task)
            .set({
              githubPrNumber: pullRequest.number,
              githubPrUrl: pullRequest.url,
              githubPrStatus: pullRequest.state,
              ...(pullRequest.state === "merged" && taskRecord.status !== "done"
                ? { status: "done" }
                : {}),
            })
            .where(eq(task.id, taskId));
        } else if (taskRecord.githubPrNumber) {
          await db
            .update(task)
            .set({
              githubPrNumber: null,
              githubPrUrl: null,
              githubPrStatus: null,
            })
            .where(eq(task.id, taskId));
        }
      }
    }

    const checkoutCommand = branch
      ? isBranchOnRemote
        ? `git checkout ${branch}`
        : `git checkout -b ${branch}`
      : `git checkout -b ${suggestedBranch}`;

    return {
      issueNumber: taskRecord.githubIssueNumber,
      issueUrl: taskRecord.githubIssueUrl,
      branch,
      isBranchOnRemote,
      suggestedBranch,
      checkoutCommand,
      repository: repo,
      pullRequest,
    };
  }
}
