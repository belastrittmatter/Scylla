"use client";

import * as React from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getTaskCommentsAction, createTaskCommentAction } from "@/actions";
import type { TaskCommentItem, TaskItem } from "./task-types";
import type { TaskUser } from "@/services/task/task-types";
import { getUserHandle } from "./task-utils";
import { TaskCommentItemRow } from "./task-comment-item-row";
import { TaskCommentMentionMenu } from "./task-comment-mention-menu";

interface TaskCommentSectionProps {
  taskId: string;
  users?: TaskUser[];
  task?: TaskItem;
  readOnly?: boolean;
}

export function TaskCommentSection({
  taskId,
  users = [],
  task,
  readOnly,
}: TaskCommentSectionProps) {
  const [comments, setComments] = React.useState<TaskCommentItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [newComment, setNewComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = React.useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const mentionMenuRef = React.useRef<HTMLDivElement>(null);

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

  const matchingUsers = React.useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    const candidateUsers = users && users.length > 0 ? users : [];
    if (!q) return candidateUsers.slice(0, 6);
    return candidateUsers
      .filter((u) => {
        const handle = getUserHandle(u);
        return (
          handle.includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [mentionQuery, users]);

  const insertMention = (user: TaskUser) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart ?? newComment.length;
    const textBeforeCursor = newComment.slice(0, cursor);
    const textAfterCursor = newComment.slice(cursor);
    const match = textBeforeCursor.match(
      /(?:^|\s)@([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]*)$/,
    );
    if (!match) return;

    const handle = getUserHandle(user);
    const mentionText = `@${handle} `;
    const startIndex = cursor - match[1].length - 1;
    const newText =
      newComment.slice(0, startIndex) + mentionText + textAfterCursor;
    setNewComment(newText);
    setMentionQuery(null);

    const newPos = startIndex + mentionText.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewComment(text);
    const cursor = e.target.selectionStart ?? text.length;
    const textBeforeCursor = text.slice(0, cursor);
    const match = textBeforeCursor.match(
      /(?:^|\s)@([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]*)$/,
    );
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Stop propagation so comment submission does not trigger task drawer save
    e.stopPropagation();

    // Mention keyboard navigation
    if (mentionQuery !== null && matchingUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % matchingUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(
          (prev) => (prev - 1 + matchingUsers.length) % matchingUsers.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (matchingUsers[mentionIndex]) {
          insertMention(matchingUsers[mentionIndex]);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleAddComment();
    }
  };

  const handleAddComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = newComment.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    setMentionQuery(null);
    const res = await createTaskCommentAction({ taskId, content });
    if (res.success && res.data) {
      setComments((prev) => {
        if (prev.some((c) => c.id === res.data!.id)) return prev;
        return [...prev, res.data as TaskCommentItem];
      });
      setNewComment("");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          <MessageSquare className="size-4 text-neutral-500" />
          <span>Activity & Discussion</span>
          <span className="text-xs font-normal text-neutral-400">
            ({comments.length})
          </span>
        </div>

        {task?.githubIssueNumber && (
          <span className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-mono text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            <svg className="size-2.5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
            </svg>
            <span>Linked to GitHub Issue #{task.githubIssueNumber}</span>
          </span>
        )}
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
        <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
          {comments.map((c) => (
            <TaskCommentItemRow
              key={c.id}
              comment={c}
              users={users}
              task={task}
            />
          ))}
        </div>
      )}

      {/* Input box with @mention autocomplete */}
      {!readOnly && (
        <form
          onSubmit={handleAddComment}
          className="relative mt-1 flex flex-col gap-2"
        >
          {/* Floating Mention Autocomplete Menu */}
          {mentionQuery !== null && (
            <TaskCommentMentionMenu
              mentionMenuRef={mentionMenuRef}
              matchingUsers={matchingUsers}
              mentionIndex={mentionIndex}
              onSelectMention={insertMention}
            />
          )}

          <Textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleTextChange}
            placeholder={
              task?.githubIssueNumber
                ? "Write a comment (Markdown, @username, syncs to GitHub)..."
                : "Write a comment or status update (@username supported)..."
            }
            rows={2}
            className="min-h-[64px] resize-none text-xs font-sans leading-relaxed"
            onKeyDown={handleKeyDown}
          />

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              Type{" "}
              <strong className="font-mono text-foreground font-semibold">
                @
              </strong>{" "}
              for username, ⌘+Enter to post
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || isSubmitting}
              className="h-7 px-3 text-xs gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Send className="size-3" />
              )}
              <span>Comment</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
