"use client";

import * as React from "react";
import { KanbanColumn } from "./kanban-column";
import { KANBAN_COLUMNS } from "./task-types";
import type { TaskItem, TaskStatus } from "./task-types";
import { validateTaskTransitionRule } from "@/services/task/task-rules";

interface KanbanBoardViewProps {
  tasks: TaskItem[];
  currentUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  currentTeamRole?: string | null;
  isProjectLinkedToGithub?: boolean;
  onSelectTask?: (task: TaskItem) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onMoveTask?: (
    taskId: string,
    targetStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
  onAddNewTask?: (status: TaskStatus) => void;
}

export function KanbanBoardView({
  tasks,
  currentUser,
  currentTeamRole,
  isProjectLinkedToGithub = false,
  onSelectTask,
  onUpdateStatus,
  onMoveTask,
  onAddNewTask,
}: KanbanBoardViewProps) {
  const [draggedTask, setDraggedTask] = React.useState<TaskItem | null>(null);

  // Global drag cleanup listener: clears draggedTask on window dragend, drop, or mouseup
  // preventing stuck isDragging states when cross-column drops remount elements.
  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggedTask(null);
    };

    window.addEventListener("dragend", handleGlobalDragEnd);
    window.addEventListener("drop", handleGlobalDragEnd);
    window.addEventListener("mouseup", handleGlobalDragEnd);

    return () => {
      window.removeEventListener("dragend", handleGlobalDragEnd);
      window.removeEventListener("drop", handleGlobalDragEnd);
      window.removeEventListener("mouseup", handleGlobalDragEnd);
    };
  }, []);

  const handleMoveTaskWithCleanup = React.useCallback(
    (taskId: string, targetStatus: TaskStatus, targetIndex?: number) => {
      setDraggedTask(null);
      onMoveTask?.(taskId, targetStatus, targetIndex);
    },
    [onMoveTask],
  );

  const handleUpdateStatusWithCleanup = React.useCallback(
    (taskId: string, status: TaskStatus) => {
      setDraggedTask(null);
      onUpdateStatus(taskId, status);
    },
    [onUpdateStatus],
  );

  return (
    <div className="flex h-full flex-1 gap-4 overflow-x-auto p-6">
      {KANBAN_COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isDropRestricted = Boolean(
          draggedTask &&
          !validateTaskTransitionRule({
            task: draggedTask,
            targetStatus: col.id,
            currentUser,
            currentTeamRole,
            isProjectLinkedToGithub,
          }).allowed,
        );

        return (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            badgeClass={col.badgeClass}
            tasks={columnTasks}
            draggedTask={draggedTask}
            isDropRestricted={isDropRestricted}
            onDragStartTask={setDraggedTask}
            onDragEndTask={() => setDraggedTask(null)}
            onSelectTask={onSelectTask}
            onUpdateStatus={handleUpdateStatusWithCleanup}
            onMoveTask={handleMoveTaskWithCleanup}
            onAddNewTask={onAddNewTask}
          />
        );
      })}
    </div>
  );
}
