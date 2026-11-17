"use client";

import * as React from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getTaskCommentsAction, createTaskCommentAction } from "@/actions";
import type { TaskCommentItem } from "./task-types";
import { TaskCommentItemRow } from "./task-comment-item-row";

interface TaskCommentSectionProps {
  taskId: string;
  /** Hides the comment input (viewers). */
  readOnly?: boolean;
}

export function TaskCommentSection({
  taskId,
  readOnly,
}: TaskCommentSectionProps) {
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
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <MessageSquare className="size-4 text-muted-foreground" />
        <span>Activity & Discussion</span>
        <span className="text-xs font-normal text-muted-foreground">
          ({comments.length})
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-xs text-muted-foreground">
          No comments yet. Leave a note or update for your team.
        </p>
      ) : (
        <div className="flex max-h-52 flex-col gap-3 overflow-y-auto pr-1">
          {comments.map((c) => (
            <TaskCommentItemRow key={c.id} comment={c} />
          ))}
        </div>
      )}

      {/* Input box */}
      {!readOnly && (
        <form onSubmit={handleAddComment} className="mt-1 flex flex-col gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment or status update..."
            rows={2}
            className="min-h-16 resize-none text-xs"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
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
      )}
    </div>
  );
}
