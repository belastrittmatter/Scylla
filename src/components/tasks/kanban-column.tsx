"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KanbanCard } from "./kanban-card";
import { StatusIcon } from "./task-status-icon";
import { cn } from "@/lib/utils";
import type { MoveTask } from "./use-task-board-state";
import type { TaskItem, TaskStatus } from "./task-types";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: TaskItem[];
  onSelectTask?: (task: TaskItem) => void;
  onUpdateStatus?: MoveTask;
  onDeleteTask?: (id: string) => Promise<boolean>;
  canDeleteTask?: (task: TaskItem) => boolean;
  onAddNewTask?: (status: TaskStatus) => void;
  readOnly?: boolean;
  getContextLabel?: (task: TaskItem) => string | null;
  showAssignee?: boolean;
  headerAction?: React.ReactNode;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  onSelectTask,
  onUpdateStatus,
  onDeleteTask,
  canDeleteTask,
  onAddNewTask,
  readOnly,
  getContextLabel,
  showAssignee,
  headerAction,
}: KanbanColumnProps) {
  const canDrag = !readOnly && Boolean(onUpdateStatus);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    if (!canDrag) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragOverIndex(null);
    }
  };

  const dropAt = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragOverIndex(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    // Reference = next visible card (skipping the dragged one); null drops at the end.
    const beforeId = tasks.slice(index).find((t) => t.id !== taskId)?.id;
    onUpdateStatus?.(taskId, id, beforeId ?? null);
  };

  // Drop above or below a card depending on which half the pointer is in.
  const cardIndex = (e: React.DragEvent, idx: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2 ? idx : idx + 1;
  };

  const handleDrop = (e: React.DragEvent) => {
    if (canDrag) dropAt(e, dragOverIndex ?? tasks.length);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex w-[85vw] shrink-0 snap-start flex-col rounded-xl sm:w-auto sm:min-w-72 sm:flex-1 sm:shrink border p-2 transition-colors",
        isDragOver
          ? "border-primary/40 bg-primary/5"
          : "border-transparent bg-muted/40",
      )}
    >
      <div className="sticky top-0 z-10 flex items-center gap-2 rounded-t-xl bg-inherit px-1 pb-2 pt-0.5">
        <StatusIcon status={id} />
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
        <div className="ml-auto flex items-center gap-1">
          {headerAction}
          {!readOnly && onAddNewTask && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onAddNewTask(id)}
              aria-label={`Add task to ${title}`}
            >
              <Plus />
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {tasks.map((task, idx) => (
          <React.Fragment key={task.id}>
            {dragOverIndex === idx && <DropIndicator />}
            <div
              draggable={canDrag}
              className={cn(canDrag && "cursor-grab active:cursor-grabbing")}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", task.id);
                e.dataTransfer.effectAllowed = "move";
                setDraggingId(task.id);
                window.getSelection?.()?.removeAllRanges();
              }}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(e) => {
                if (!canDrag) return;
                e.preventDefault();
                e.stopPropagation();
                setDragOverIndex(cardIndex(e, idx));
              }}
              onDrop={(e) => {
                if (!canDrag) return;
                e.stopPropagation();
                dropAt(e, cardIndex(e, idx));
              }}
            >
              <KanbanCard
                task={task}
                onSelectTask={onSelectTask}
                onUpdateStatus={readOnly ? undefined : onUpdateStatus}
                onDeleteTask={
                  readOnly || canDeleteTask?.(task) === false
                    ? undefined
                    : onDeleteTask
                }
                contextLabel={getContextLabel?.(task)}
                showAssignee={showAssignee}
                isDragging={draggingId === task.id}
              />
            </div>
          </React.Fragment>
        ))}
        {dragOverIndex === tasks.length && tasks.length > 0 && (
          <DropIndicator />
        )}
        {tasks.length === 0 && !readOnly && onAddNewTask && (
          // Card-shaped placeholder at the top so empty columns invite a first task.
          <Button
            variant="ghost"
            onClick={() => onAddNewTask(id)}
            className="h-auto justify-start rounded-lg border border-dashed border-border p-3 text-muted-foreground hover:text-foreground"
          >
            <Plus />
            Add task
          </Button>
        )}
        {/* Filler: keeps "drop at end" reachable below the last card. */}
        <div
          className="min-h-8 flex-1"
          onDragOver={(e) => {
            if (!canDrag) return;
            e.preventDefault();
            setDragOverIndex(tasks.length);
          }}
        />
      </div>
    </div>
  );
}

const DropIndicator = () => (
  <div className="-my-1 h-0.5 rounded-full bg-primary" />
);
