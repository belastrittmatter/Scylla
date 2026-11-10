"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import type { TaskCommentItem, TaskItem } from "./task-types";
import type { TaskUser } from "@/services/task/task-types";
import { getUserAvatarColor } from "./task-utils";

export interface TaskCommentItemRowProps {
  comment: TaskCommentItem;
  users?: TaskUser[];
  task?: TaskItem;
}

export function TaskCommentItemRow({
  comment: c,
  users = [],
  task,
}: TaskCommentItemRowProps) {
  const author = c.user?.name || "Team Member";
  const avatarColor = getUserAvatarColor(author);

  return (
    <div className="flex items-start gap-2.5 text-xs">
      <Avatar className="mt-0.5 size-6 border border-neutral-200 text-[10px] dark:border-neutral-700">
        <AvatarImage src={c.user?.avatarUrl || ""} alt={author} />
        <AvatarFallback className={avatarColor}>
          {c.user?.initials || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 rounded-lg bg-neutral-50/80 p-2.5 border border-neutral-100 dark:border-neutral-800/80 dark:bg-neutral-800/50">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {author}
            </span>
            {c.htmlUrl && (
              <a
                href={c.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded bg-neutral-200/60 px-1.5 py-0.2 font-mono text-[10px] text-neutral-600 hover:text-neutral-900 dark:bg-neutral-700/60 dark:text-neutral-300"
                title="View comment on GitHub"
              >
                <svg
                  className="size-2.5 fill-current shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
                </svg>
                <span>GitHub</span>
              </a>
            )}
          </div>
          <span className="text-[10px] text-neutral-400">
            {formatDistanceToNow(new Date(c.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        <div className="text-xs text-neutral-800 dark:text-neutral-200">
          <MarkdownViewer
            content={c.content}
            users={users}
            repo={task?.project?.githubRepo || undefined}
          />
        </div>
      </div>
    </div>
  );
}
