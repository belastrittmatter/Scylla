"use client";

import * as React from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusIcon } from "./task-status-icon";
import {
  TASK_FORM_STATUSES,
  type TaskItem,
  type TaskStatus,
} from "./task-types";

interface KanbanCardMenuProps {
  task: TaskItem;
  onUpdateStatus?: (taskId: string, status: TaskStatus) => void;
  onDeleteTask?: (id: string) => Promise<boolean>;
}

/**
 * Hover "⋯" menu. Render inside an element that stops click propagation:
 * portal clicks bubble through the React tree to the card's onClick.
 */
export function KanbanCardMenu({
  task,
  onUpdateStatus,
  onDeleteTask,
}: KanbanCardMenuProps) {
  const [confirming, setConfirming] = React.useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Task actions"
              className="size-5 opacity-0 [grid-area:1/1] focus-visible:opacity-100 group-hover:opacity-100 data-popup-open:opacity-100"
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onUpdateStatus && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {TASK_FORM_STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    disabled={s.value === task.status}
                    onClick={() => onUpdateStatus(task.id, s.value)}
                  >
                    <StatusIcon status={s.value} />
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {onUpdateStatus && onDeleteTask && <DropdownMenuSeparator />}
          {onDeleteTask && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirming(true)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {onDeleteTask && (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title="Delete task?"
          description={`"${task.title}" will be deleted. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={async () => {
            await onDeleteTask(task.id);
          }}
        />
      )}
    </>
  );
}
