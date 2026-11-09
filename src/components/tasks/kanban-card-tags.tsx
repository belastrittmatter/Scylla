"use client";

import * as React from "react";
import { GitBranch, GitPullRequest, Timer } from "lucide-react";
import { formatEstimatedMinutes } from "./task-utils";
import type { TaskItem } from "./task-types";
import { cn } from "@/lib/utils";

interface KanbanCardTagsProps {
  task: TaskItem;
  isLinkedWithGithub: boolean;
}

export function KanbanCardTags({
  task,
  isLinkedWithGithub,
}: KanbanCardTagsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Branch (Tech view only) */}
      {isLinkedWithGithub && task.githubBranch && (
        <span
          className="inline-flex max-w-[180px] items-center gap-1.5 rounded-md border border-neutral-200/80 bg-neutral-50 px-2 py-0.5 font-mono text-[10.5px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
          title={`Git branch: ${task.githubBranch}`}
        >
          <GitBranch className="size-3 shrink-0 text-neutral-400" />
          <span className="truncate">{task.githubBranch}</span>
        </span>
      )}

      {/* PR badge (Tech view only) */}
      {isLinkedWithGithub && task.githubPrNumber && (
        <a
          href={task.githubPrUrl || undefined}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10.5px] transition-colors",
            task.githubPrStatus === "merged"
              ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
              : task.githubPrStatus === "open"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400",
          )}
          title={`Pull Request #${task.githubPrNumber} (${task.githubPrStatus || "open"})`}
        >
          <GitPullRequest className="size-3 shrink-0" />
          <span>PR #{task.githubPrNumber}</span>
        </a>
      )}

      {/* Estimate badge */}
      {task.estimatedMinutes !== undefined &&
        task.estimatedMinutes !== null && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200/70 bg-neutral-50/80 px-2 py-0.5 text-[10.5px] font-normal text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
            <Timer className="size-3 text-neutral-400" />
            <span>{formatEstimatedMinutes(task.estimatedMinutes)}</span>
          </span>
        )}
    </div>
  );
}
