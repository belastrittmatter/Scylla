import { eq } from "drizzle-orm";
import { db } from "@/db";
import { project, task, type Task } from "@/db/schema";
import { parseGithubRepo } from "@/lib/github-validation";
import { GITHUB_API_URL, GithubAuthService } from "./github-auth-service";
import {
  buildCheckoutCommand,
  generateBranchName,
  isPrLinkedToIssue,
  mapGitHubPrState,
  type GithubPrState,
} from "./github-dev-utils";

export interface TaskPullRequestInfo {
  number: number;
  url: string;
  title: string;
  state: GithubPrState;
}

export interface TaskDevelopmentInfo {
  repository: string | null;
  issueNumber: number | null;
  issueUrl: string | null;
  branch: string | null;
  isBranchOnRemote: boolean;
  suggestedBranch: string;
  checkoutCommand: string;
  pullRequest: TaskPullRequestInfo | null;
}

interface LookupResult {
  ok: boolean;
  pr: TaskPullRequestInfo | null;
}

interface PullItem {
  number: number;
  html_url: string;
  title: string;
  state: string;
  draft?: boolean | null;
  merged_at?: string | null;
  head?: { ref?: string | null } | null;
}

interface TimelineEvent {
  event?: string;
  source?: {
    issue?: {
      number: number;
      title?: string | null;
      body?: string | null;
      state: string;
      draft?: boolean | null;
      html_url: string;
      pull_request?: { merged_at?: string | null } | null;
    };
  };
}

const PR_STATES: readonly string[] = ["open", "draft", "merged", "closed"];

function storedPullRequest(t: Task): TaskPullRequestInfo | null {
  if (t.githubPrNumber == null) return null;
  const status = t.githubPrStatus ?? "";
  return {
    number: t.githubPrNumber,
    url: t.githubPrUrl ?? "",
    title: "",
    state: PR_STATES.includes(status) ? (status as GithubPrState) : "open",
  };
}

async function getJson(
  url: string,
  userId: string,
): Promise<{ ok: boolean; data: unknown }> {
  try {
    const res = await GithubAuthService.fetchWithAuth(url, {}, userId);
    if (!res.ok) return { ok: false, data: null };
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, data: null };
  }
}

async function findPrByBranch(
  base: string,
  owner: string,
  branch: string,
  userId: string,
): Promise<LookupResult> {
  const { ok, data } = await getJson(
    `${base}/pulls?head=${owner}:${encodeURIComponent(branch)}&state=all`,
    userId,
  );
  if (!ok || !Array.isArray(data)) return { ok: false, pr: null };
  const match = (data as PullItem[]).find((p) => p.head?.ref === branch);
  if (!match) return { ok: true, pr: null };
  return {
    ok: true,
    pr: {
      number: match.number,
      url: match.html_url,
      title: match.title,
      state: mapGitHubPrState(match),
    },
  };
}

async function findPrByTimeline(
  base: string,
  issueNumber: number,
  branch: string | null,
  userId: string,
): Promise<LookupResult> {
  const { ok, data } = await getJson(
    `${base}/issues/${issueNumber}/timeline?per_page=100`,
    userId,
  );
  if (!ok || !Array.isArray(data)) return { ok: false, pr: null };
  for (const ev of data as TimelineEvent[]) {
    const issue = ev.source?.issue;
    if (ev.event !== "cross-referenced" || !issue?.pull_request) continue;
    const linked = isPrLinkedToIssue(
      { number: issue.number, title: issue.title, body: issue.body },
      issueNumber,
      branch,
    );
    if (!linked) continue;
    return {
      ok: true,
      pr: {
        number: issue.number,
        url: issue.html_url,
        title: issue.title ?? "",
        state: mapGitHubPrState({
          merged_at: issue.pull_request.merged_at,
          draft: issue.draft,
          state: issue.state,
        }),
      },
    };
  }
  return { ok: true, pr: null };
}

export class GithubDevService {
  static async getTaskDevelopmentInfo(
    taskId: string,
    userId?: string,
  ): Promise<TaskDevelopmentInfo> {
    const [t] = await db.select().from(task).where(eq(task.id, taskId));
    if (!t) throw new Error(`Task "${taskId}" not found`);

    let parsed: ReturnType<typeof parseGithubRepo> = null;
    if (t.projectId) {
      const [p] = await db
        .select({ githubRepo: project.githubRepo })
        .from(project)
        .where(eq(project.id, t.projectId));
      parsed = parseGithubRepo(p?.githubRepo);
    }

    const suggestedBranch =
      t.githubBranch ?? generateBranchName(t.githubIssueNumber, t.title);
    const actingUserId = userId ?? t.creatorId;
    const token = parsed
      ? await GithubAuthService.resolveToken(actingUserId)
      : undefined;
    const live =
      parsed && token && (t.githubBranch || t.githubIssueNumber != null);

    let isBranchOnRemote = false;
    let pullRequest = storedPullRequest(t);

    if (parsed && live) {
      const base = `${GITHUB_API_URL}/repos/${parsed.owner}/${parsed.repo}`;
      if (t.githubBranch) {
        isBranchOnRemote = (
          await getJson(
            `${base}/branches/${encodeURIComponent(t.githubBranch)}`,
            actingUserId,
          )
        ).ok;
      }

      const results: LookupResult[] = [];
      if (t.githubBranch) {
        results.push(
          await findPrByBranch(
            base,
            parsed.owner,
            t.githubBranch,
            actingUserId,
          ),
        );
      }
      if (!results[0]?.pr && t.githubIssueNumber != null) {
        results.push(
          await findPrByTimeline(
            base,
            t.githubIssueNumber,
            t.githubBranch,
            actingUserId,
          ),
        );
      }

      const found = results.find((r) => r.pr)?.pr ?? null;
      if (found) {
        pullRequest = found;
        await db
          .update(task)
          .set({
            githubPrNumber: found.number,
            githubPrUrl: found.url,
            githubPrStatus: found.state,
          })
          .where(eq(task.id, taskId));
      } else if (results.every((r) => r.ok)) {
        pullRequest = null;
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

    const branch = t.githubBranch;
    return {
      repository: parsed?.fullName ?? null,
      issueNumber: t.githubIssueNumber,
      issueUrl: t.githubIssueUrl,
      branch,
      isBranchOnRemote,
      suggestedBranch,
      checkoutCommand: buildCheckoutCommand(
        branch ?? suggestedBranch,
        isBranchOnRemote,
      ),
      pullRequest,
    };
  }
}
