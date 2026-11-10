"use client";

import * as React from "react";
import { format } from "date-fns";
import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { TaskCommentSection } from "./task-comment-section";
import { TaskDrawerSidebar } from "./task-drawer-sidebar";
import { TaskDrawerHeader } from "./task-drawer-header";
import { TaskDrawerDeleteButton } from "./task-drawer-delete-button";
import type {
  TaskItem,
  TaskPriority,
  TaskStatus,
  TaskUser,
} from "./task-types";

interface TaskDrawerProps {
  task: TaskItem | null;
  isOpen: boolean;
  users: TaskUser[];
  onClose: () => void;
  /** Resolves true when persisted; the drawer closes only then. */
  onSaveTask: (updated: TaskItem) => Promise<boolean>;
  /** Only passed when the user may delete this task. */
  onDeleteTask?: () => Promise<boolean>;
  /** Viewers: fields disabled, no save or comment input. */
  readOnly?: boolean;
}

export function TaskDrawer({ task, isOpen, ...props }: TaskDrawerProps) {
  // Retain the last non-null task during render (official React pattern for deriving state from props).
  // This allows the drawer to smoothly animate its exit without content unmounting.
  const [cachedTask, setCachedTask] = React.useState<TaskItem | null>(task);
  if (task && task !== cachedTask) {
    setCachedTask(task);
  }

  const displayTask = task || cachedTask;

  if (!displayTask) return null;

  return (
    <TaskDrawerInner
      key={displayTask.id}
      task={displayTask}
      isOpen={isOpen}
      {...props}
    />
  );
}

function TaskDrawerInner({
  task,
  isOpen,
  users,
  onClose,
  onSaveTask,
  onDeleteTask,
  readOnly,
}: TaskDrawerProps & { task: TaskItem }) {
  const isDraft = task.id.startsWith("draft-");
  const isLinkedWithGithub = Boolean(
    task.githubIssueNumber || task.project?.githubRepo,
  );
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description || "");
  const [status, setStatus] = React.useState<TaskStatus>(
    task.status as TaskStatus,
  );
  const [priority, setPriority] = React.useState<TaskPriority>(
    task.priority as TaskPriority,
  );
  const [assigneeId, setAssigneeId] = React.useState<string>(
    task.assigneeId || "unassigned",
  );
  const [dueDateStr, setDueDateStr] = React.useState(
    task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
  );
  const [estimatedMinutes, setEstimatedMinutes] = React.useState<number>(
    task.estimatedMinutes ?? 60,
  );
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async (shouldClose: boolean = false) => {
    if (readOnly || !title.trim() || isSaving) return;

    const matchedAssignee =
      assigneeId === "unassigned"
        ? null
        : users.find((u) => u.id === assigneeId) || null;

    const updated: TaskItem = {
      ...task,
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      assigneeId: assigneeId === "unassigned" ? null : assigneeId,
      assignee: matchedAssignee,
      dueDate: dueDateStr ? new Date(`${dueDateStr}T18:00:00Z`) : null,
      estimatedMinutes,
      updatedAt: new Date(),
    };

    setIsSaving(true);
    try {
      const ok = await onSaveTask(updated);
      if (ok && (shouldClose || isDraft)) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSave(false);
    }
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      swipeDirection="right"
      showSwipeHandle
    >
      <DrawerContent
        onKeyDown={handleKeyDown}
        className="flex h-full w-full flex-col data-[swipe-axis=x]:sm:[--drawer-content-width:46rem] data-[swipe-axis=x]:md:[--drawer-content-width:58rem] data-[swipe-axis=x]:lg:[--drawer-content-width:70rem] data-[swipe-axis=x]:xl:[--drawer-content-width:80rem] max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl"
      >
        {/* Main Content Area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 md:p-7 space-y-6">
          {/* Header */}
          <TaskDrawerHeader
            task={task}
            title={title}
            status={status}
            isDraft={isDraft}
            isLinkedWithGithub={isLinkedWithGithub}
            onTitleChange={setTitle}
            onClose={onClose}
          />

          {/* Main 2-Column Body */}
          <div className="flex flex-col lg:flex-row gap-7 items-start">
            {/* Left Primary Column: Description & Comments */}
            <div className="flex-1 w-full min-w-0 space-y-6">
              {/* Description Markdown Editor */}
              <div className="space-y-1.5">
                <MarkdownEditor
                  id="task-description"
                  value={description}
                  onChange={setDescription}
                  minRows={10}
                  minHeightClassName="min-h-[260px]"
                  placeholder="Add a detailed description, acceptance criteria, checklists (- [ ]), tables, or notes (Markdown supported)..."
                />
              </div>

              {/* Discussion & Comment Thread */}
              {!isDraft && (
                <div className="pt-2">
                  <TaskCommentSection
                    taskId={task.id}
                    users={users}
                    task={task}
                    readOnly={readOnly}
                  />
                </div>
              )}
            </div>

            {/* Right Column: Properties Sidebar (Status, Priority, Assignee, Estimate, GitHub Dev) */}
            <TaskDrawerSidebar
              task={task}
              isDraft={isDraft}
              users={users}
              assigneeId={assigneeId}
              status={status}
              priority={priority}
              dueDateStr={dueDateStr}
              estimatedMinutes={estimatedMinutes}
              isLinkedWithGithub={isLinkedWithGithub}
              onAssigneeChange={setAssigneeId}
              onStatusChange={setStatus}
              onPriorityChange={setPriority}
              onDueDateChange={setDueDateStr}
              onEstimatedMinutesChange={setEstimatedMinutes}
              onTaskUpdated={(updated) => {
                setStatus(updated.status as TaskStatus);
                void onSaveTask(updated);
              }}
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <DrawerFooter className="flex shrink-0 flex-row items-center justify-between gap-2 border-t border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-6 py-3.5">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
            Press{" "}
            <kbd className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[11px] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
              ⌘+Enter
            </kbd>{" "}
            to save changes without closing
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {!isDraft && onDeleteTask && (
              <TaskDrawerDeleteButton
                title={task.title}
                onDelete={onDeleteTask}
                onDeleted={onClose}
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 px-3 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {isDraft ? "Cancel" : "Close"}
            </Button>
            {!isDraft && !readOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSave(true)}
                disabled={!title.trim() || isSaving}
                className="text-xs h-8 px-3 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Save & Close
              </Button>
            )}
            {!readOnly && (
              <Button
                size="sm"
                onClick={() => void handleSave(isDraft)}
                disabled={!title.trim() || isSaving}
                className="text-xs h-8 px-4 font-medium"
              >
                {isDraft ? "Create Task" : "Save Changes"}
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
