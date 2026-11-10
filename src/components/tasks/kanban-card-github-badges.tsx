"use client";

import * as React from "react";
import { GitBranch, GitPullRequest } from "lucide-react";
import type { TaskItem } from "./task-types";
import { cn } from "@/lib/utils";

interface KanbanCardGithubBadgesProps {
  task: TaskItem;
}

export function KanbanCardGithubBadges({ task }: KanbanCardGithubBadgesProps) {
  const isLinkedWithGithub = Boolean(
    task.project?.githubRepo?.trim() ||
    task.githubIssueUrl ||
    task.githubIssueNumber,
  );

  if (!isLinkedWithGithub) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      {/* GitHub Issue Badge */}
      {task.githubIssueNumber && (
        <a
          href={
            task.githubIssueUrl ||
            (task.project?.githubRepo
              ? `https://github.com/${task.project.githubRepo}/issues/${task.githubIssueNumber}`
              : undefined)
          }
          target="_blank"
          rel="noreferrer"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex shrink-0 items-center gap-1 rounded border border-border/80 bg-muted/50 px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          title={`View Issue #${task.githubIssueNumber} on GitHub`}
        >
          <svg className="size-2.5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
          </svg>
          <span>#{task.githubIssueNumber}</span>
        </a>
      )}

      {/* GitHub Branch Badge */}
      {task.githubBranch && (
        <span
          className="inline-flex max-w-[170px] items-center gap-1 rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          title={`Git branch: ${task.githubBranch}`}
        >
          <GitBranch className="size-2.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{task.githubBranch}</span>
        </span>
      )}

      {/* GitHub PR Badge */}
      {task.githubPrNumber && (
        <a
          href={task.githubPrUrl || undefined}
          target="_blank"
          rel="noreferrer"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors",
            task.githubPrStatus === "merged"
              ? "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
              : task.githubPrStatus === "open"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "border-border bg-muted/50 text-muted-foreground hover:bg-muted",
          )}
          title={`Pull Request #${task.githubPrNumber} (${task.githubPrStatus || "open"})`}
        >
          <GitPullRequest className="size-2.5 shrink-0" />
          <span>PR #{task.githubPrNumber}</span>
        </a>
      )}
    </div>
  );
}
