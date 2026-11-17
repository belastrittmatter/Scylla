"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KanbanCard } from "./kanban-card";
import { StatusIcon } from "./task-status-icon";
import { cn } from "@/lib/utils";
import { MONO_META } from "./task-layout";
import type { MoveTask } from "./use-task-board-state";
import type { TaskItem, TaskStatus } from "./task-types";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: TaskItem[];
  onSelectTask?: (task: TaskItem) => void;
  onUpdateStatus?: MoveTask;
  onDeleteTask?: (id: string) => Promise<boolean>;
  canEditTask?: (task: TaskItem) => boolean;
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
  canEditTask,
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
      // Unfilled lane: -mx-2/px-2 lets the drag highlight bleed past the cards while
      // the content stays on the gutter; a dashed rail (before:) divides lanes.
      className={cn(
        "relative -mx-2 flex w-[85vw] shrink-0 snap-start flex-col rounded-lg px-2 pb-2 outline-1 -outline-offset-1 transition-colors sm:w-auto sm:min-w-72 sm:flex-1 sm:shrink",
        "before:pointer-events-none before:absolute before:inset-y-0 before:-left-px before:border-l before:border-dashed before:border-border first:before:hidden",
        isDragOver ? "bg-primary/5 outline-primary/40" : "outline-transparent",
      )}
    >
      <div className="sticky top-0 z-10 flex h-9 items-center gap-2 border-b bg-inherit">
        <StatusIcon status={id} />
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <span className={cn(MONO_META, "text-muted-foreground")}>
          {tasks.length}
        </span>
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
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pt-3">
        {tasks.map((task, idx) => {
          const editable = !readOnly && canEditTask?.(task) !== false;
          return (
            <React.Fragment key={task.id}>
              {dragOverIndex === idx && <DropIndicator />}
              <div
                draggable={canDrag && editable}
                className={cn(
                  canDrag && editable && "cursor-grab active:cursor-grabbing",
                )}
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
                  onUpdateStatus={editable ? onUpdateStatus : undefined}
                  onDeleteTask={editable ? onDeleteTask : undefined}
                  contextLabel={getContextLabel?.(task)}
                  showAssignee={showAssignee}
                  isDragging={draggingId === task.id}
                />
              </div>
            </React.Fragment>
          );
        })}
        {dragOverIndex === tasks.length && tasks.length > 0 && (
          <DropIndicator />
        )}
        {tasks.length === 0 && !readOnly && onAddNewTask && (
          // Card-shaped placeholder at the top so empty columns invite a first task.
          <Button
            variant="ghost"
            onClick={() => onAddNewTask(id)}
            className="h-auto justify-start rounded-md border border-dashed border-border p-3 text-muted-foreground hover:text-foreground"
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
