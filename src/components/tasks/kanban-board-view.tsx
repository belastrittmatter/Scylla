"use client";

import * as React from "react";
import { KanbanColumn } from "./kanban-column";
import { cn } from "@/lib/utils";
import type { MoveTask } from "./use-task-board-state";
import { KANBAN_COLUMNS } from "./task-types";
import type { TaskItem, TaskStatus } from "./task-types";

type KanbanColumnDef = (typeof KANBAN_COLUMNS)[number];

interface KanbanBoardViewProps {
  tasks: TaskItem[];
  onSelectTask?: (task: TaskItem) => void;
  onUpdateStatus?: MoveTask;
  onDeleteTask?: (id: string) => Promise<boolean>;
  /** Hides Delete, status and drag on cards the user may not edit. */
  canEditTask?: (task: TaskItem) => boolean;
  onAddNewTask?: (status: TaskStatus) => void;
  readOnly?: boolean;
  getContextLabel?: (task: TaskItem) => string | null;
  showAssignee?: boolean;
  /** Defaults to KANBAN_COLUMNS. */
  columns?: readonly KanbanColumnDef[];
  renderColumnAction?: (columnId: TaskStatus) => React.ReactNode;
  className?: string;
}

export function KanbanBoardView({
  tasks,
  onSelectTask,
  onUpdateStatus,
  onDeleteTask,
  canEditTask,
  onAddNewTask,
  readOnly,
  getContextLabel,
  showAssignee,
  columns = KANBAN_COLUMNS,
  renderColumnAction,
  className,
}: KanbanBoardViewProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-1 snap-x snap-mandatory gap-4 overflow-x-auto p-6 sm:snap-none",
        className,
      )}
    >
      {columns.map((col) => (
        <KanbanColumn
          key={col.id}
          id={col.id}
          title={col.title}
          tasks={tasks.filter((t) => t.status === col.id)}
          onSelectTask={onSelectTask}
          onUpdateStatus={onUpdateStatus}
          onDeleteTask={onDeleteTask}
          canEditTask={canEditTask}
          onAddNewTask={onAddNewTask}
          readOnly={readOnly}
          getContextLabel={getContextLabel}
          showAssignee={showAssignee}
          headerAction={renderColumnAction?.(col.id)}
        />
      ))}
    </div>
  );
}
