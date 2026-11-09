"use client";

import * as React from "react";
import { AtSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { TaskUser } from "@/services/task/task-types";
import { getUserHandle } from "./task-utils";

export interface TaskCommentMentionMenuProps {
  mentionMenuRef: React.RefObject<HTMLDivElement | null>;
  matchingUsers: TaskUser[];
  mentionIndex: number;
  onSelectMention: (user: TaskUser) => void;
}

export function TaskCommentMentionMenu({
  mentionMenuRef,
  matchingUsers,
  mentionIndex,
  onSelectMention,
}: TaskCommentMentionMenuProps) {
  if (matchingUsers.length === 0) return null;

  return (
    <div
      ref={mentionMenuRef}
      className="absolute bottom-full left-0 mb-1.5 w-72 rounded-lg border border-border bg-popover p-1 shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
    >
      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-border/50 border-b">
        <AtSign className="size-3" />
        <span>Mention Team Member</span>
      </div>
      <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto pt-1">
        {matchingUsers.map((u, i) => (
          <button
            key={u.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelectMention(u);
            }}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left transition-colors cursor-pointer",
              i === mentionIndex
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-muted/70 text-foreground",
            )}
          >
            <Avatar className="size-5 shrink-0 border border-border">
              <AvatarImage src={u.avatarUrl || u.image || ""} />
              <AvatarFallback className="text-[9px]">
                {u.initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-medium text-foreground">{u.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  @{getUserHandle(u)}
                </span>
              </div>
              {u.email && (
                <div className="truncate text-[10px] text-muted-foreground">
                  {u.email}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
