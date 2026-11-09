"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { TASK_FORM_STATUSES } from "./task-types";
import type { TaskStatus } from "./task-types";
import { cn } from "@/lib/utils";

interface KanbanCardHeaderProps {
  priorityBadgeClass: string;
  priorityLabel: string;
  isLinkedWithGithub: boolean;
  githubIssueNumber?: number | null;
  githubIssueUrl?: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  taskId: string;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
}

export function KanbanCardHeader({
  priorityBadgeClass,
  priorityLabel,
  isLinkedWithGithub,
  githubIssueNumber,
  githubIssueUrl,
  isCollapsed,
  onToggleCollapse,
  taskId,
  onUpdateStatus,
}: KanbanCardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "px-2 py-0.5 text-[11px] font-medium shrink-0",
            priorityBadgeClass,
          )}
        >
          {priorityLabel}
        </Badge>

        {isLinkedWithGithub && githubIssueNumber && (
          <a
            href={githubIssueUrl || undefined}
            target="_blank"
            rel="noreferrer"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex shrink-0 items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] text-neutral-600 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            title="View issue on GitHub"
          >
            <svg className="size-2.5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
            </svg>
            <span>#{githubIssueNumber}</span>
          </a>
        )}
      </div>

      <div
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex shrink-0 items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
      >
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleCollapse}
          className="size-6 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          title={isCollapsed ? "Expand card" : "Collapse card"}
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              isCollapsed && "-rotate-90",
            )}
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-6 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                title="Move to..."
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-36 text-xs">
            {TASK_FORM_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status.value}
                onClick={() => onUpdateStatus(taskId, status.value)}
                className="cursor-pointer gap-1.5 text-xs"
              >
                <span className={cn("size-2 rounded-full", status.dot)} />
                <span>{status.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
