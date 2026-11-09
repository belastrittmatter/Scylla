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
            onUpdateStatus={onUpdateStatus}
            onMoveTask={onMoveTask}
            onAddNewTask={onAddNewTask}
          />
        );
      })}
    </div>
  );
}
