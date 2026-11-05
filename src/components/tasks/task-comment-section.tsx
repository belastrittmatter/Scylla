"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getTaskCommentsAction, createTaskCommentAction } from "@/actions";
import type { TaskCommentItem } from "./task-types";
import { getUserAvatarColor } from "./task-utils";

interface TaskCommentSectionProps {
  taskId: string;
}

export function TaskCommentSection({ taskId }: TaskCommentSectionProps) {
  const [comments, setComments] = React.useState<TaskCommentItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [newComment, setNewComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function loadComments() {
      setIsLoading(true);
      const res = await getTaskCommentsAction(taskId);
      if (isMounted && res.success && res.data) {
        setComments(res.data);
      }
      if (isMounted) setIsLoading(false);
    }
    loadComments();
    return () => {
      isMounted = false;
    };
  }, [taskId]);

  const handleAddComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = newComment.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    const res = await createTaskCommentAction({ taskId, content });
    if (res.success && res.data) {
      setComments((prev) => [...prev, res.data as TaskCommentItem]);
      setNewComment("");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
        <MessageSquare className="size-4 text-neutral-500" />
        <span>Activity & Discussion</span>
        <span className="text-xs font-normal text-neutral-400">
          ({comments.length})
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4 text-neutral-400">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-xs text-neutral-400">
          No comments yet. Leave a note or update for your team.
        </p>
      ) : (
        <div className="flex max-h-52 flex-col gap-3 overflow-y-auto pr-1">
          {comments.map((c) => {
            const author = c.user?.name || "Team Member";
            const avatarColor = getUserAvatarColor(author);
            return (
              <div key={c.id} className="flex items-start gap-2.5 text-xs">
                <Avatar className="mt-0.5 size-6 border border-neutral-200 text-[10px] dark:border-neutral-700">
                  <AvatarImage src={c.user?.avatarUrl || ""} alt={author} />
                  <AvatarFallback className={avatarColor}>
                    {c.user?.initials || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/60">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {author}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {formatDistanceToNow(new Date(c.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                    {c.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input box */}
      <form onSubmit={handleAddComment} className="mt-1 flex flex-col gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment or status update..."
          rows={2}
          className="min-h-[60px] resize-none text-xs"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleAddComment();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-neutral-400">
            Press ⌘+Enter to comment
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || isSubmitting}
            className="h-7 px-3 text-xs"
          >
            {isSubmitting ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <Send className="mr-1 size-3" />
            )}
            Comment
          </Button>
        </div>
      </form>
    </div>
  );
}
