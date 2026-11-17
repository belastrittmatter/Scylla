import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import type { TaskCommentView } from "@/services/task/workspace-types";
import { getUserAvatarColor } from "./task-utils";

export function TaskCommentRow({ comment: c }: { comment: TaskCommentView }) {
  const author = c.user?.name || "Team Member";
  const avatarUrl = c.user?.avatarUrl || c.user?.image || "";
  return (
    <div className="flex items-start gap-2.5 text-xs">
      <Avatar className="mt-0.5 size-6 border border-border text-xs">
        <AvatarImage src={avatarUrl} alt={author} />
        <AvatarFallback className={getUserAvatarColor(author)}>
          {c.user?.initials || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 rounded-lg bg-muted p-2.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">{author}</span>
            {c.source === "github" &&
              (c.htmlUrl ? (
                <a href={c.htmlUrl} target="_blank" rel="noreferrer">
                  <Badge variant="outline" className="text-xs">
                    GitHub
                  </Badge>
                </a>
              ) : (
                <Badge variant="outline" className="text-xs">
                  GitHub
                </Badge>
              ))}
            {c.source === "local" && c.githubCommentId && (
              <span className="text-xs text-muted-foreground">
                Synced to GitHub
              </span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
          </span>
        </div>
        <MarkdownViewer content={c.content} className="text-xs" />
      </div>
    </div>
  );
}
