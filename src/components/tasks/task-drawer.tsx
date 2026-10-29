"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { TaskDrawerForm } from "./task-drawer-form";
import { TaskCommentSection } from "./task-comment-section";
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
  onSaveTask: (updated: TaskItem) => void;
}

export function TaskDrawer({
  task,
  isOpen,
  users,
  onClose,
  onSaveTask,
}: TaskDrawerProps) {
  if (!isOpen || !task) return null;

  return (
    <TaskDrawerInner
      key={task.id}
      task={task}
      isOpen={isOpen}
      users={users}
      onClose={onClose}
      onSaveTask={onSaveTask}
    />
  );
}

function TaskDrawerInner({
  task,
  isOpen,
  users,
  onClose,
  onSaveTask,
}: TaskDrawerProps & { task: TaskItem }) {
  const isDraft = task.id.startsWith("draft-");
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

  const handleSave = () => {
    if (!title.trim()) return;

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

    onSaveTask(updated);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
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
        className="flex h-full w-full flex-col sm:max-w-md"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
          <DrawerHeader className="border-b border-neutral-100 p-0 pb-3 text-left dark:border-neutral-800">
            <DrawerTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {isDraft ? "Create Task" : "Task Details"}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              {isDraft
                ? "Enter task details, priority, assignee, and target deadline."
                : "Update task metadata, priority, assignee, and target deadline."}{" "}
              Press{" "}
              <kbd className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                ⌘+Enter
              </kbd>{" "}
              to save.
            </DrawerDescription>
          </DrawerHeader>

          <TaskDrawerForm
            title={title}
            description={description}
            status={status}
            priority={priority}
            assigneeId={assigneeId}
            dueDateStr={dueDateStr}
            estimatedMinutes={estimatedMinutes}
            users={users}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onStatusChange={setStatus}
            onPriorityChange={setPriority}
            onAssigneeChange={setAssigneeId}
            onDueDateChange={setDueDateStr}
            onEstimatedMinutesChange={setEstimatedMinutes}
          />

          {!isDraft && <TaskCommentSection taskId={task.id} />}
        </div>

        <DrawerFooter className="flex shrink-0 flex-row justify-end gap-2 border-t border-neutral-100 p-4 dark:border-neutral-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!title.trim()}
            className="text-sm"
          >
            {isDraft ? "Create Task" : "Save Changes"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
