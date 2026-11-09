"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KanbanCard } from "./kanban-card";
import { KanbanColumnEmpty } from "./kanban-column-empty";
import type { TaskItem, TaskStatus } from "./task-types";
import { cn } from "@/lib/utils";

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

  // Global cleanup listener so drag state never gets stuck
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

  const handleDropOnEmpty = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      if (onMoveTask) {
        onMoveTask(taskId, id, targetIndex);
      } else {
        onUpdateStatus(taskId, id);
      }
    }
  };

  // Issue #74 fix: Chrome captures the drag preview asynchronously from live DOM elements.
  // Mutations (like 1s timer) and animations (pulse, transitions) corrupt the snapshot,
  // causing it to shrink or clone the whole window. We create a static, animation-free clone.
  const handleCardDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    task: TaskItem,
  ) => {
    onDragStartTask?.(task);
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";

    try {
      const clone = e.currentTarget.cloneNode(true) as HTMLElement;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.position = "fixed";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.pointerEvents = "none";
      clone.style.animation = "none";
      clone.style.transition = "none";
      clone.style.opacity = "1";
      clone.style.zIndex = "-9999";
      clone.querySelectorAll("*").forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.animation = "none";
          el.style.transition = "none";
        }
      });
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(
        clone,
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
      requestAnimationFrame(() => {
        clone.remove();
      });
    } catch {
      // Browser fallback
    }

    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
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

      {/* Task Cards List */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            draggable
            className="relative cursor-grab select-none active:cursor-grabbing"
            onDragStart={(e) => handleCardDragStart(e, task)}
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
              setHoveredCardId(task.id);
              setHoverPosition(e.clientY < midY ? "top" : "bottom");
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
              isDragging={draggedTask?.id === task.id}
              onSelectTask={onSelectTask}
              onUpdateStatus={onUpdateStatus}
            />
          </div>
        ))}

        <KanbanColumnEmpty
          id={id}
          tasksLength={tasks.length}
          isDragOver={isDragOver}
          isDropRestricted={Boolean(isDropRestricted)}
          onAddNewTask={onAddNewTask}
          onDropTask={handleDropOnEmpty}
          onDragOverColumn={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
        />
      </div>
    </div>
  );
}
