"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ExternalLink,
  X,
  CircleDot,
  Timer,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TaskItem, TaskStatus } from "./task-types";

export function getStatusPill(status: TaskStatus) {
  switch (status) {
    case "todo":
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-neutral-300 bg-neutral-100/80 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-300 font-medium px-2.5 py-0.5 text-xs"
        >
          <CircleDot className="size-3.5" />
          <span>To Do</span>
        </Badge>
      );
    case "in_progress":
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium px-2.5 py-0.5 text-xs"
        >
          <Timer className="size-3.5" />
          <span>In Progress</span>
        </Badge>
      );
    case "in_review":
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium px-2.5 py-0.5 text-xs"
        >
          <Clock className="size-3.5" />
          <span>In Review</span>
        </Badge>
      );
    case "done":
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-0.5 text-xs"
        >
          <CheckCircle2 className="size-3.5" />
          <span>Done</span>
        </Badge>
      );
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium px-2.5 py-0.5 text-xs"
        >
          <XCircle className="size-3.5" />
          <span>Cancelled</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1.5 px-2.5 py-0.5 text-xs">
          <CircleDot className="size-3.5" />
          <span className="capitalize">{status}</span>
        </Badge>
      );
  }
}

export interface TaskDrawerHeaderProps {
  task: TaskItem;
  title: string;
  status: TaskStatus;
  isDraft: boolean;
  isLinkedWithGithub: boolean;
  onTitleChange: (v: string) => void;
  onClose: () => void;
}

export function TaskDrawerHeader({
  task,
  title,
  status,
  isDraft,
  isLinkedWithGithub,
  onTitleChange,
  onClose,
}: TaskDrawerHeaderProps) {
  return (
    <div className="space-y-3 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isLinkedWithGithub && task.githubIssueNumber && (
              <span className="font-mono text-xl md:text-2xl font-light text-neutral-400 dark:text-neutral-500 select-none shrink-0">
                #{task.githubIssueNumber}
              </span>
            )}
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={
                isLinkedWithGithub ? "Issue title..." : "Task title..."
              }
              className="w-full bg-transparent text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-hidden focus:ring-1 focus:ring-primary/40 rounded px-2 py-0.5 -ml-2 transition-all"
              autoFocus={isDraft}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLinkedWithGithub &&
            task.githubIssueNumber &&
            task.githubIssueUrl && (
              <a
                href={task.githubIssueUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:white transition-colors"
                title="Open issue on GitHub"
              >
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
                </svg>
                <span>GitHub #{task.githubIssueNumber}</span>
                <ExternalLink className="size-3 text-neutral-400" />
              </a>
            )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
            title="Close (Esc)"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
        {getStatusPill(status)}
        {isDraft ? (
          <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">
            New task draft (not created yet)
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            {task.creator && (
              <Avatar className="size-4 shrink-0 border border-neutral-200 dark:border-neutral-700">
                <AvatarImage src={task.creator.image || undefined} />
                <AvatarFallback className="text-[9px]">
                  {task.creator.name?.slice(0, 2).toUpperCase() || "AU"}
                </AvatarFallback>
              </Avatar>
            )}
            <span>
              <strong className="font-medium text-neutral-900 dark:text-neutral-100">
                {task.creator?.name || "Author"}
              </strong>{" "}
              opened this task{" "}
              {task.createdAt
                ? formatDistanceToNow(new Date(task.createdAt), {
                    addSuffix: true,
                  })
                : "just now"}
            </span>
          </div>
        )}

        {task.project && (
          <Badge
            variant="outline"
            className="gap-1.5 font-normal text-[11px] py-0.5 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          >
            <span
              className="size-1.5 rounded-full"
              style={{
                backgroundColor: task.project.color || "#6366f1",
              }}
            />
            <span>{task.project.name}</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
