"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import type { TaskStatus } from "./task-types";
import { cn } from "@/lib/utils";

interface KanbanColumnEmptyProps {
  id: TaskStatus;
  tasksLength: number;
  isDragOver: boolean;
  isDropRestricted: boolean;
  onAddNewTask?: (status: TaskStatus) => void;
  onDropTask: (e: React.DragEvent, targetIndex: number) => void;
  onDragOverColumn: (e: React.DragEvent) => void;
}

export function KanbanColumnEmpty({
  id,
  tasksLength,
  isDragOver,
  isDropRestricted,
  onAddNewTask,
  onDropTask,
  onDragOverColumn,
}: KanbanColumnEmptyProps) {
  // Empty column state when tasksLength === 0
  if (tasksLength === 0) {
    if (id === "todo" && onAddNewTask) {
      return (
        <button
          type="button"
          onClick={() => onAddNewTask(id)}
          onDragOver={onDragOverColumn}
          onDrop={(e) => onDropTask(e, 0)}
          className="group/empty hover:border-primary/50 hover:bg-primary/5 hover:text-primary dark:hover:border-primary/50 dark:hover:bg-primary/10 flex min-h-[104px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200/90 bg-white/40 p-4 text-center transition-all dark:border-neutral-800 dark:bg-neutral-900/30"
        >
          <div className="flex flex-col items-center gap-1 group-hover/empty:hidden">
            <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
              No tasks
            </span>
            <span className="text-[11px] text-neutral-400/80 dark:text-neutral-500/80">
              Hover to add or drop task here
            </span>
          </div>
          <div className="text-primary hidden flex-col items-center gap-1 group-hover/empty:flex">
            <div className="bg-primary/10 flex size-7 items-center justify-center rounded-full">
              <Plus className="size-4" />
            </div>
            <span className="text-xs font-semibold">Add task</span>
          </div>
        </button>
      );
    }

    return (
      <div
        onDragOver={onDragOverColumn}
        onDrop={(e) => onDropTask(e, 0)}
        className={cn(
          "flex min-h-[104px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all",
          isDragOver
            ? isDropRestricted
              ? "border-rose-400/80 bg-rose-50/30 dark:border-rose-500/50 dark:bg-rose-950/20"
              : "border-primary/50 bg-primary/5 dark:bg-primary/10"
            : "border-neutral-200/70 bg-white/30 dark:border-neutral-800/80 dark:bg-neutral-900/20",
        )}
      >
        <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
          No tasks
        </span>
        <span className="text-[11px] text-neutral-400/80 dark:text-neutral-500/80">
          Drag tasks here
        </span>
      </div>
    );
  }

  // Column with tasks: Add Task Button ONLY in To Do column at the bottom
  if (tasksLength > 0 && onAddNewTask && id === "todo") {
    return (
      <button
        type="button"
        onClick={() => onAddNewTask(id)}
        onDragOver={onDragOverColumn}
        onDrop={(e) => onDropTask(e, tasksLength)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed font-medium transition-all duration-300 ease-in-out",
          tasksLength >= 3
            ? "h-8 border-neutral-200/90 bg-white/60 text-xs text-neutral-500 hover:border-neutral-300 hover:bg-white hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            : "hover:border-primary/50 hover:bg-primary/5 hover:text-primary dark:hover:border-primary/50 dark:hover:bg-primary/10 h-14 border-2 border-neutral-200/90 bg-white/70 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400",
        )}
      >
        <div className="flex items-center gap-1.5 transition-all">
          <Plus
            className={cn(
              "transition-all",
              tasksLength >= 3 ? "size-3.5" : "size-4",
            )}
          />
          <span>Add task</span>
        </div>
      </button>
    );
  }

  return null;
}
