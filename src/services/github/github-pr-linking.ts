import type { GithubPrState, GithubPullSummary } from "./github-types";

export interface GithubRawPull {
  number: number;
  html_url: string;
  title?: string | null;
  state: string;
  draft?: boolean | null;
  merged_at?: string | null;
  head?: { ref?: string | null } | null;
}

export function mapPullState(
  pr: Pick<GithubRawPull, "state" | "draft" | "merged_at">,
): GithubPrState {
  if (pr.merged_at) return "merged";
  if (pr.draft) return "draft";
  return pr.state === "closed" ? "closed" : "open";
}

export function toPullSummary(pr: GithubRawPull): GithubPullSummary {
  return {
    number: pr.number,
    url: pr.html_url,
    title: pr.title ?? "",
    state: mapPullState(pr),
    headRef: pr.head?.ref ?? null,
  };
}

interface TimelineEvent {
  event?: unknown;
  source?: {
    issue?: {
      number?: unknown;
      pull_request?: unknown;
      repository?: { full_name?: unknown } | null;
    };
  } | null;
}

export function timelinePullNumbers(
  events: unknown,
  repoFullName: string,
): number[] {
  if (!Array.isArray(events)) return [];
  const wanted = repoFullName.toLowerCase();
  const numbers: number[] = [];
  for (const raw of events as Array<TimelineEvent | null>) {
    if (!raw || raw.event !== "cross-referenced") continue;
    const issue = raw.source?.issue;
    if (!issue?.pull_request || typeof issue.number !== "number") continue;
    const repo = issue.repository?.full_name;
    if (typeof repo === "string" && repo.toLowerCase() !== wanted) continue;
    if (!numbers.includes(issue.number)) numbers.push(issue.number);
  }
  return numbers;
}

const STATE_RANK: Record<GithubPrState, number> = {
  open: 0,
  draft: 1,
  merged: 2,
  closed: 3,
};

export function pickLinkedPullRequest(
  pulls: GithubPullSummary[],
  ctx: {
    issueNumber: number | null;
    branch: string | null;
    timelinePullNumbers: number[];
  },
): GithubPullSummary | null {
  const branch = ctx.branch?.trim().toLowerCase();
  const byBranch = branch
    ? pulls.filter((p) => p.headRef?.trim().toLowerCase() === branch)
    : [];
  const byTimeline =
    ctx.issueNumber === null
      ? []
      : pulls.filter(
          (p) =>
            p.number !== ctx.issueNumber &&
            ctx.timelinePullNumbers.includes(p.number),
        );
  const candidates = byBranch.length > 0 ? byBranch : byTimeline;
  const sorted = [...candidates].sort(
    (a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || b.number - a.number,
  );
  return sorted[0] ?? null;
}
