"use client";

import * as React from "react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  dueDateToInput,
  getTaskDateRangeError,
  inputToDueDate,
  inputToStartDate,
  startDateToInput,
} from "./task-utils";
import { TaskDrawerForm } from "./task-drawer-form";
import { TaskDrawerHeader } from "./task-drawer-header";
import { TaskCommentSection } from "./task-comment-section";
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
  if (!isOpen || !task) return null;

  return (
    <TaskDrawerInner key={task.id} task={task} isOpen={isOpen} {...props} />
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
  const [startDateStr, setStartDateStr] = React.useState(
    startDateToInput(task.startDate),
  );
  const [dueDateStr, setDueDateStr] = React.useState(
    dueDateToInput(task.dueDate),
  );
  const [estimatedMinutes, setEstimatedMinutes] = React.useState<number>(
    task.estimatedMinutes ?? 60,
  );

  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (readOnly || !title.trim() || isSaving) return;
    const rangeError = getTaskDateRangeError(startDateStr, dueDateStr);
    if (rangeError) {
      toast.error(rangeError);
      return;
    }

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
      startDate: inputToStartDate(startDateStr),
      dueDate: inputToDueDate(dueDateStr),
      estimatedMinutes,
      updatedAt: new Date(),
    };

    setIsSaving(true);
    try {
      if (await onSaveTask(updated)) onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSave();
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
          <TaskDrawerHeader isDraft={isDraft} />

          <fieldset disabled={readOnly} className="contents">
            <TaskDrawerForm
              title={title}
              description={description}
              status={status}
              priority={priority}
              assigneeId={assigneeId}
              startDateStr={startDateStr}
              dueDateStr={dueDateStr}
              estimatedMinutes={estimatedMinutes}
              users={users}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onStatusChange={setStatus}
              onPriorityChange={setPriority}
              onAssigneeChange={setAssigneeId}
              onStartDateChange={setStartDateStr}
              onDueDateChange={setDueDateStr}
              onEstimatedMinutesChange={setEstimatedMinutes}
            />
          </fieldset>

          {!isDraft && (
            <TaskCommentSection taskId={task.id} readOnly={readOnly} />
          )}
        </div>

        <DrawerFooter className="flex shrink-0 flex-row justify-end gap-2 border-t border-border p-4">
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
            className="text-sm"
          >
            Cancel
          </Button>
          {!readOnly && (
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={!title.trim() || isSaving}
              className="text-sm"
            >
              {isDraft ? "Create Task" : "Save Changes"}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
