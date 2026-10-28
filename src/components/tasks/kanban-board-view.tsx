"use client";

import * as React from "react";
import { KanbanColumn } from "./kanban-column";
import { KANBAN_COLUMNS } from "./task-types";
import type { TaskItem, TaskStatus } from "./task-types";

interface KanbanBoardViewProps {
  tasks: TaskItem[];
  onSelectTask?: (task: TaskItem) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onMoveTask?: (taskId: string, targetStatus: TaskStatus, targetIndex?: number) => void;
  onAddNewTask?: (status: TaskStatus) => void;
}

export function KanbanBoardView({
  tasks,
  onSelectTask,
  onUpdateStatus,
  onMoveTask,
  onAddNewTask,
}: KanbanBoardViewProps) {
  return (
    <div className="flex h-full flex-1 gap-4 overflow-x-auto p-6">
      {KANBAN_COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);

        return (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            badgeClass={col.badgeClass}
            tasks={columnTasks}
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
