"use client";

import * as React from "react";
import { toast } from "sonner";
import { updateTaskStatusAction } from "@/actions";
import { apiClient } from "@/lib/api-client";
import { moveTaskInList } from "./task-move";
import { restoreFailedTasks } from "./task-utils";
import type { TaskItem, TaskStatus } from "./task-types";

/** Optimistic move; `beforeTaskId` is the global-list neighbour (null = end of column). */
export type MoveTask = (
  taskId: string,
  status: TaskStatus,
  beforeTaskId?: string | null,
) => void;

export function useTaskBoardState(
  tasks: TaskItem[],
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>,
) {
  const handleMoveTask: MoveTask = (taskId, status, beforeTaskId) => {
    const previous = tasks;
    setTasks(moveTaskInList(tasks, taskId, status, beforeTaskId));
    const rollback = (message?: string) => {
      setTasks(previous);
      toast.error(message ?? "Failed to move task");
    };
    updateTaskStatusAction(taskId, status)
      .then((res) => {
        if (!res.success) rollback(res.error);
      })
      .catch(() => rollback());
  };

  /** Optimistic bulk delete; resolves true only if every delete succeeded. */
  const handleDeleteTasks = async (ids: string[]): Promise<boolean> => {
    const snapshot = tasks;
    const gone = new Set(ids);
    setTasks(tasks.filter((t) => !gone.has(t.id)));
    const results = await Promise.allSettled(
      ids.map((id) => apiClient.tasks.delete(id)),
    );
    const failed = new Set<string>();
    let message = "Failed to delete task";
    results.forEach((r, i) => {
      if (r.status === "fulfilled") return;
      failed.add(ids[i]);
      if (r.reason instanceof Error) message = r.reason.message;
    });
    if (failed.size === 0) return true;
    setTasks((cur) => restoreFailedTasks(cur, snapshot, failed));
    toast.error(message);
    return false;
  };

  return { handleMoveTask, handleDeleteTasks };
}
