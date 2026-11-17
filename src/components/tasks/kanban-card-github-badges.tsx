"use client";

import * as React from "react";
import { GitBranch, GitPullRequest } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskItem } from "./task-types";
import { githubIssueHref, prStatusLabel } from "./task-github-summary";

const PR_COLORS: Record<string, string> = {
  merged: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  open: "bg-green-500/10 text-green-600 dark:text-green-400",
  draft: "bg-muted text-muted-foreground",
  closed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const CHIP = "inline-flex items-center gap-1 rounded px-1.5 py-0.5";
const linkProps = {
  target: "_blank",
  rel: "noopener noreferrer",
  draggable: false,
  onClick: (e: React.SyntheticEvent) => e.stopPropagation(),
};

export function KanbanCardGithubBadges({ task }: { task: TaskItem }) {
  const { githubIssueNumber, githubBranch, githubPrNumber } = task;
  if (githubIssueNumber == null && !githubBranch && githubPrNumber == null) {
    return null;
  }
  const issueHref = githubIssueHref(task);
  const issueTitle = `View issue #${githubIssueNumber} on GitHub`;
  const prStatus = task.githubPrStatus ?? "open";
  const prClass = cn(CHIP, PR_COLORS[prStatus] ?? PR_COLORS.open);
  const prContent = (
    <>
      <GitPullRequest className="size-3" />
      {`PR #${githubPrNumber} ${prStatusLabel(task.githubPrStatus)}`}
    </>
  );

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {githubIssueNumber != null &&
        (issueHref ? (
          <a
            href={issueHref}
            title={issueTitle}
            className={cn(CHIP, "bg-muted hover:text-foreground")}
            {...linkProps}
          >
            {`#${githubIssueNumber}`}
          </a>
        ) : (
          <span title={issueTitle} className={cn(CHIP, "bg-muted")}>
            {`#${githubIssueNumber}`}
          </span>
        ))}
      {githubBranch && (
        <span
          title={`Branch: ${githubBranch}`}
          className={cn(CHIP, "max-w-full bg-muted")}
        >
          <GitBranch className="size-3 shrink-0" />
          <span className="truncate">{githubBranch}</span>
        </span>
      )}
      {githubPrNumber != null &&
        (task.githubPrUrl ? (
          <a
            href={task.githubPrUrl}
            data-pr-status={prStatus}
            className={prClass}
            {...linkProps}
          >
            {prContent}
          </a>
        ) : (
          <span data-pr-status={prStatus} className={prClass}>
            {prContent}
          </span>
        ))}
    </div>
  );
}
