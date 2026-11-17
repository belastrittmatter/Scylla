"use client";

import * as React from "react";
import { CircleDot, GitBranch, GitPullRequest } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskItem } from "./task-types";

const PR_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  draft: "Draft",
  merged: "Merged",
  closed: "Closed",
};

const PR_STATUS_CLASSES: Record<string, string> = {
  merged: "border-purple-500/40 text-purple-600 dark:text-purple-400",
  open: "border-green-500/40 text-green-600 dark:text-green-400",
  draft: "border-border text-muted-foreground",
  closed: "border-red-500/40 text-red-600 dark:text-red-400",
};

const BADGE =
  "inline-flex min-w-0 items-center gap-1 rounded border px-1.5 py-0.5 text-xs";

export function hasGithubBadges(
  task: Pick<TaskItem, "githubIssueNumber" | "githubBranch" | "githubPrNumber">,
): boolean {
  return (
    task.githubIssueNumber != null ||
    Boolean(task.githubBranch) ||
    task.githubPrNumber != null
  );
}

export function getPrStatusLabel(
  status: string | null | undefined,
): string | null {
  if (!status || !Object.hasOwn(PR_STATUS_LABELS, status)) return null;
  return PR_STATUS_LABELS[status];
}

export function countLinkedPullRequests(
  tasks: readonly Pick<TaskItem, "githubPrNumber">[],
): number {
  return tasks.filter((t) => t.githubPrNumber != null).length;
}

/** Link that neither opens the task nor starts a drag. */
function BadgeLink({
  href,
  className,
  children,
  ...rest
}: React.ComponentProps<"a"> & { href?: string }) {
  if (!href)
    return (
      <span className={className} {...(rest as object)}>
        {children}
      </span>
    );
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      draggable={false}
      onClick={(e) => e.stopPropagation()}
      className={cn(className, "hover:bg-accent")}
      {...rest}
    >
      {children}
    </a>
  );
}

export function TaskGithubBadges({
  task,
  className,
}: {
  task: TaskItem;
  className?: string;
}) {
  if (!hasGithubBadges(task)) return null;

  const issueNumber = task.githubIssueNumber;
  const repo = task.project?.githubRepo;
  const issueUrl =
    task.githubIssueUrl ??
    (issueNumber != null && repo
      ? `https://github.com/${repo}/issues/${issueNumber}`
      : null);
  const prLabel = getPrStatusLabel(task.githubPrStatus);
  const prStatus = task.githubPrStatus ?? "";

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {issueNumber != null && (
        <BadgeLink
          href={issueUrl ?? undefined}
          title={`GitHub issue #${issueNumber}`}
          className={cn(BADGE, "shrink-0 text-muted-foreground")}
        >
          <CircleDot className="size-3" />
          {`#${issueNumber}`}
        </BadgeLink>
      )}
      {task.githubBranch && (
        <span
          title={`Branch: ${task.githubBranch}`}
          className={cn(BADGE, "max-w-40 font-mono text-muted-foreground")}
        >
          <GitBranch className="size-3 shrink-0" />
          <span className="truncate">{task.githubBranch}</span>
        </span>
      )}
      {task.githubPrNumber != null && (
        <BadgeLink
          href={task.githubPrUrl ?? undefined}
          data-pr-status={prStatus}
          title={`Pull request #${task.githubPrNumber}${prStatus ? ` (${prStatus})` : ""}`}
          className={cn(
            BADGE,
            "shrink-0",
            PR_STATUS_CLASSES[prStatus] ?? "text-muted-foreground",
          )}
        >
          <GitPullRequest className="size-3" />
          {`PR #${task.githubPrNumber}${prLabel ? ` ${prLabel}` : ""}`}
        </BadgeLink>
      )}
    </div>
  );
}
