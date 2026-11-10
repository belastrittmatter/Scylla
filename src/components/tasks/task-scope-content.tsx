"use client";

import * as React from "react";
import { KanbanBoardView } from "./kanban-board-view";
import { TaskTableView } from "./task-table-view";
import { TaskTimelineView } from "./task-timeline-view";
import {
  TaskScopeEmptyState,
  type TaskEmptyKind,
} from "./task-scope-empty-state";
import type { TaskScope } from "./task-selectors";
import type { MoveTask } from "./use-task-board-state";
import type { TaskItem, TaskStatus } from "./task-types";

export type TaskViewMode = "board" | "list" | "timeline";

interface TaskScopeContentProps {
  scope: TaskScope;
  viewMode: TaskViewMode;
  tasks: TaskItem[];
  /** Set when `tasks` is empty: which empty state to show. */
  emptyKind: TaskEmptyKind | null;
  onEmptyAction?: () => void;
  emptySecondary?: { label: string; onClick: () => void };
  getContextLabel?: (task: TaskItem) => string | null;
  showAssignee: boolean;
  onSelectTask: (task: TaskItem) => void;
  onUpdateStatus: MoveTask;
  onAddNewTask?: (status: TaskStatus) => void;
  onDeleteTasks: (ids: string[]) => Promise<boolean>;
  /** Mirrors the server task write rule; gates delete, move and status affordances. */
  canEditTask: (task: TaskItem) => boolean;
}

export function TaskScopeContent({
  scope,
  viewMode,
  tasks,
  emptyKind,
  onEmptyAction,
  emptySecondary,
  onAddNewTask,
  onDeleteTasks,
  canEditTask,
  ...rowProps
}: TaskScopeContentProps) {
  if (emptyKind) {
    return (
      <TaskScopeEmptyState
        kind={emptyKind}
        onAction={onEmptyAction}
        secondary={emptySecondary}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {viewMode === "board" && (
        <KanbanBoardView
          tasks={tasks}
          onAddNewTask={onAddNewTask}
          onDeleteTask={(id) => onDeleteTasks([id])}
          canEditTask={canEditTask}
          {...rowProps}
        />
      )}
      {viewMode === "list" && (
        <TaskTableView
          tasks={tasks}
          // Team shows closed work too, so deadline buckets would mislabel done tasks as overdue.
          groupBy={scope === "team" ? "status" : "deadline"}
          onDeleteTasks={onDeleteTasks}
          canEditTask={canEditTask}
          {...rowProps}
        />
      )}
      {viewMode === "timeline" && (
        <TaskTimelineView
          tasks={tasks}
          getContextLabel={rowProps.getContextLabel}
          onSelectTask={rowProps.onSelectTask}
        />
      )}
    </div>
  );
}
