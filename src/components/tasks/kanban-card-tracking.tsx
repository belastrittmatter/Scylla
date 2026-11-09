"use client";

import * as React from "react";
import { Timer } from "lucide-react";
import {
  formatTimer,
  formatEstimatedMinutes,
  formatDurationSeconds,
} from "./task-utils";
import type { TaskStatus } from "./task-types";
import { cn } from "@/lib/utils";

interface KanbanCardTrackingProps {
  status: TaskStatus;
  isCollapsed: boolean;
  totalElapsed: number;
  estimatedSeconds: number;
  estimatedMinutes?: number | null;
  totalSpentSeconds?: number | null;
  progressPercent: number;
  isOvertime: boolean;
  isDragging?: boolean;
}

export function KanbanCardTracking({
  status,
  isCollapsed,
  totalElapsed,
  estimatedSeconds,
  estimatedMinutes,
  totalSpentSeconds,
  progressPercent,
  isOvertime,
  isDragging = false,
}: KanbanCardTrackingProps) {
  // Collapsed In-Progress micro badge
  if (isCollapsed && status === "in_progress") {
    return (
      <div className="flex items-center justify-between font-mono text-[10.5px] text-neutral-600 dark:text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "size-1.5 rounded-full bg-emerald-500",
              !isDragging && "animate-pulse",
            )}
          />
          <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatTimer(totalElapsed)}
          </span>
        </span>
        <span
          className={cn(
            isOvertime ? "font-semibold text-rose-500" : "text-neutral-400",
          )}
        >
          {isOvertime
            ? `+${formatDurationSeconds(totalElapsed - estimatedSeconds)}`
            : formatEstimatedMinutes(estimatedMinutes)}
        </span>
      </div>
    );
  }

  // Active Time Tracking Bar (expanded)
  if (!isCollapsed && status === "in_progress") {
    return (
      <div className="rounded-lg border border-neutral-100 bg-neutral-50/90 p-2.5 text-xs transition-colors dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="flex items-center justify-between text-[11px] font-medium">
          <span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <span
              className={cn(
                "size-1.5 rounded-full bg-emerald-500",
                !isDragging && "animate-pulse",
              )}
            />
            <span className="font-semibold text-[10.5px]">Tracking</span>
            <span className="font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100 text-xs">
              {formatTimer(totalElapsed)}
            </span>
          </span>
          <span
            className={cn(
              "text-[10.5px]",
              isOvertime
                ? "font-semibold text-rose-600 dark:text-rose-400"
                : "text-neutral-500 dark:text-neutral-400",
            )}
          >
            {isOvertime
              ? `+${formatDurationSeconds(totalElapsed - estimatedSeconds)} over`
              : `Est: ${formatEstimatedMinutes(estimatedMinutes)}`}
          </span>
        </div>

        <div className="mt-1.5">
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-800"
          >
            <div
              className={cn(
                "h-full rounded-full",
                !isDragging && "transition-[width] duration-300",
                isOvertime
                  ? "bg-rose-500"
                  : progressPercent >= 80
                    ? "bg-amber-500"
                    : "bg-neutral-800 dark:bg-neutral-200",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Spent summary for paused/completed tasks with logged time (expanded only)
  if (
    !isCollapsed &&
    status !== "in_progress" &&
    (totalSpentSeconds || 0) > 0
  ) {
    return (
      <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1.5">
          <Timer className="size-3 text-neutral-400" />
          <span>Spent: {formatDurationSeconds(totalSpentSeconds!)}</span>
        </span>
        {estimatedMinutes && (
          <span>Est: {formatEstimatedMinutes(estimatedMinutes)}</span>
        )}
      </div>
    );
  }

  return null;
}
