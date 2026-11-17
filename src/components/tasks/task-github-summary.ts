import type { TaskItem } from "./task-types";

const PR_LABELS: Record<string, string> = {
  open: "Open",
  draft: "Draft",
  merged: "Merged",
  closed: "Closed",
};

export function prStatusLabel(status: string | null | undefined): string {
  return (status && PR_LABELS[status]) || "Open";
}

export function summarizeColumnGithub(
  tasks: Array<Pick<TaskItem, "githubIssueNumber" | "githubPrNumber">>,
): { issues: number; pullRequests: number } {
  return {
    issues: tasks.filter((t) => t.githubIssueNumber != null).length,
    pullRequests: tasks.filter((t) => t.githubPrNumber != null).length,
  };
}

export function formatColumnGithubSummary(summary: {
  issues: number;
  pullRequests: number;
}): string | null {
  const parts: string[] = [];
  if (summary.issues > 0) {
    parts.push(
      `${summary.issues} ${summary.issues === 1 ? "issue" : "issues"}`,
    );
  }
  if (summary.pullRequests > 0) {
    parts.push(
      `${summary.pullRequests} ${summary.pullRequests === 1 ? "PR" : "PRs"}`,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function githubIssueHref(
  task: Pick<
    TaskItem,
    "githubIssueNumber" | "githubIssueUrl" | "githubRepo"
  > & { project?: { githubRepo: string | null } | null },
): string | null {
  if (task.githubIssueUrl) return task.githubIssueUrl;
  const repo = task.githubRepo ?? task.project?.githubRepo ?? null;
  if (!repo || task.githubIssueNumber == null) return null;
  return `https://github.com/${repo}/issues/${task.githubIssueNumber}`;
}
