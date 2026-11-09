"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";
import type { TaskItem, TaskStatus } from "./task-types";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  badgeClass: string;
  tasks: TaskItem[];
  draggedTask?: TaskItem | null;
  isDropRestricted?: boolean;
  onDragStartTask?: (task: TaskItem) => void;
  onDragEndTask?: () => void;
  onSelectTask?: (task: TaskItem) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onMoveTask?: (
    taskId: string,
    targetStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
  onAddNewTask?: (status: TaskStatus) => void;
}

export function KanbanColumn({
  id,
  title,
  badgeClass,
  tasks,
  draggedTask,
  isDropRestricted,
  onDragStartTask,
  onDragEndTask,
  onSelectTask,
  onUpdateStatus,
  onMoveTask,
  onAddNewTask,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [hoveredCardId, setHoveredCardId] = React.useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = React.useState<
    "top" | "bottom" | null
  >(null);

  // Global cleanup listener so drag state never gets stuck (e.g. if dropped on another column or window blur)
  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsDragOver(false);
      setHoveredCardId(null);
      setHoverPosition(null);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if we left the column element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setHoveredCardId(null);
      setHoverPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setHoveredCardId(null);
    setHoverPosition(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      if (onMoveTask) {
        onMoveTask(taskId, id, tasks.length);
      } else {
        onUpdateStatus(taskId, id);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "group flex min-w-[280px] flex-1 flex-col rounded-xl border p-3.5 transition-colors",
        isDragOver
          ? isDropRestricted
            ? "border-rose-400/80 bg-rose-50/30 dark:border-rose-500/50 dark:bg-rose-950/20 cursor-not-allowed"
            : "border-primary/50 bg-primary/5 dark:bg-primary/10"
          : "border-neutral-200/60 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40",
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {title}
          </h3>
          <Badge
            variant="secondary"
            className={cn("px-2 py-0.5 text-xs font-semibold", badgeClass)}
          >
            {tasks.length}
          </Badge>
        </div>

        {onAddNewTask && id === "todo" && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onAddNewTask(id)}
            className="size-6 text-neutral-400 transition-colors hover:bg-neutral-200/60 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            title={`Add task to ${title}`}
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>

      {/* Task Cards List - comfortably spaced */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            draggable
            className="relative cursor-grab select-none active:cursor-grabbing"
            onDragStart={(e) => {
              onDragStartTask?.(task);
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              e.dataTransfer.setData("text/plain", task.id);
              e.dataTransfer.effectAllowed = "move";
              try {
                e.dataTransfer.setDragImage(
                  e.currentTarget,
                  e.clientX - rect.left,
                  e.clientY - rect.top,
                );
              } catch {
                // Ignore fallback
              }
              if (window.getSelection) {
                window.getSelection()?.removeAllRanges();
              }
            }}
            onDragEnd={() => {
              onDragEndTask?.();
              setHoveredCardId(null);
              setHoverPosition(null);
              setIsDragOver(false);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const midY = rect.top + rect.height / 2;
              const pos = e.clientY < midY ? "top" : "bottom";
              setHoveredCardId(task.id);
              setHoverPosition(pos);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                if (hoveredCardId === task.id) {
                  setHoveredCardId(null);
                  setHoverPosition(null);
                }
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const midY = rect.top + rect.height / 2;
              const targetIdx = e.clientY < midY ? idx : idx + 1;
              setHoveredCardId(null);
              setHoverPosition(null);
              setIsDragOver(false);
              const taskId = e.dataTransfer.getData("text/plain");
              if (taskId) {
                if (onMoveTask) {
                  onMoveTask(taskId, id, targetIdx);
                } else {
                  onUpdateStatus(taskId, id);
                }
              }
            }}
          >
            {/* Non-reflowing absolute drop indicator */}
            {hoveredCardId === task.id && hoverPosition === "top" && (
              <div className="absolute -top-1.5 left-1 right-1 h-1 rounded-full bg-primary shadow-xs z-30 pointer-events-none animate-pulse" />
            )}
            {hoveredCardId === task.id && hoverPosition === "bottom" && (
              <div className="absolute -bottom-1.5 left-1 right-1 h-1 rounded-full bg-primary shadow-xs z-30 pointer-events-none animate-pulse" />
            )}

            <KanbanCard
              task={task}
              onSelectTask={onSelectTask}
              onUpdateStatus={onUpdateStatus}
            />
          </div>
        ))}

        {/* Empty column state */}
        {tasks.length === 0 &&
          (id === "todo" && onAddNewTask ? (
            <button
              type="button"
              onClick={() => onAddNewTask(id)}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const taskId = e.dataTransfer.getData("text/plain");
                if (taskId) {
                  if (onMoveTask) {
                    onMoveTask(taskId, id, 0);
                  } else {
                    onUpdateStatus(taskId, id);
                  }
                }
              }}
              className="group/empty hover:border-primary/50 hover:bg-primary/5 hover:text-primary dark:hover:border-primary/50 dark:hover:bg-primary/10 flex min-h-[104px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200/90 bg-white/40 p-4 text-center transition-all dark:border-neutral-800 dark:bg-neutral-900/30"
            >
              {/* Resting state */}
              <div className="flex flex-col items-center gap-1 group-hover/empty:hidden">
                <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                  No tasks
                </span>
                <span className="text-[11px] text-neutral-400/80 dark:text-neutral-500/80">
                  Hover to add or drop task here
                </span>
              </div>
              {/* Hover state */}
              <div className="text-primary hidden flex-col items-center gap-1 group-hover/empty:flex">
                <div className="bg-primary/10 flex size-7 items-center justify-center rounded-full">
                  <Plus className="size-4" />
                </div>
                <span className="text-xs font-semibold">Add task</span>
              </div>
            </button>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const taskId = e.dataTransfer.getData("text/plain");
                if (taskId) {
                  if (onMoveTask) {
                    onMoveTask(taskId, id, 0);
                  } else {
                    onUpdateStatus(taskId, id);
                  }
                }
              }}
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
          ))}

        {/* Column with tasks: Add Task Button ONLY in To Do column */}
        {tasks.length > 0 && onAddNewTask && id === "todo" && (
          <button
            type="button"
            onClick={() => onAddNewTask(id)}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const taskId = e.dataTransfer.getData("text/plain");
              if (taskId) {
                if (onMoveTask) {
                  onMoveTask(taskId, id, tasks.length);
                } else {
                  onUpdateStatus(taskId, id);
                }
              }
            }}
            className={cn(
              "flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed font-medium transition-all duration-300 ease-in-out",
              tasks.length >= 3
                ? "h-8 border-neutral-200/90 bg-white/60 text-xs text-neutral-500 hover:border-neutral-300 hover:bg-white hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                : "hover:border-primary/50 hover:bg-primary/5 hover:text-primary dark:hover:border-primary/50 dark:hover:bg-primary/10 h-14 border-2 border-neutral-200/90 bg-white/70 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400",
            )}
          >
            <div className="flex items-center gap-1.5 transition-all">
              <Plus
                className={cn(
                  "transition-all",
                  tasks.length >= 3 ? "size-3.5" : "size-4",
                )}
              />
              <span>Add task</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
