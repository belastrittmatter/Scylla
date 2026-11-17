"use client";

import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import type { TaskCommentItem } from "./task-types";
import { getUserAvatarColor } from "./task-utils";

const linkProps = { target: "_blank", rel: "noopener noreferrer" } as const;

export function TaskCommentItemRow({
  comment: c,
}: {
  comment: TaskCommentItem;
}) {
  const author = c.user?.name || "Team Member";
  const isGithub = c.source === "github";
  const synced = !isGithub && Boolean(c.githubCommentId);

  return (
    <div className="flex items-start gap-2.5 text-xs">
      <Avatar className="mt-0.5 size-6 border border-border text-xs">
        <AvatarImage src={c.user?.avatarUrl || ""} alt={author} />
        <AvatarFallback className={getUserAvatarColor(author)}>
          {c.user?.initials || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 rounded-lg bg-muted p-2.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 font-semibold text-foreground">
            <span className="truncate">{author}</span>
            {isGithub && <Badge variant="outline">GitHub</Badge>}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
          </span>
        </div>
        <MarkdownViewer content={c.content} />
        {isGithub && c.htmlUrl && (
          <a
            href={c.htmlUrl}
            {...linkProps}
            className="mt-1 inline-block text-muted-foreground underline hover:text-foreground"
          >
            View on GitHub
          </a>
        )}
        {synced &&
          (c.htmlUrl ? (
            <a
              href={c.htmlUrl}
              {...linkProps}
              className="mt-1 inline-block text-muted-foreground underline hover:text-foreground"
            >
              Synced to GitHub
            </a>
          ) : (
            <span className="mt-1 inline-block text-muted-foreground">
              Synced to GitHub
            </span>
          ))}
      </div>
    </div>
  );
}
