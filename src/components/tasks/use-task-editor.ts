"use client";

import * as React from "react";
import { toast } from "sonner";
import { updateTaskAction, createTaskAction } from "@/actions";
import { getPersonInitials } from "@/lib/format-person-name";
import { withStatus } from "./task-move";
import { createDraftTask } from "./task-utils";
import type { Project, TaskItem, TaskStatus, TaskUser } from "./task-types";

type UseTaskEditorArgs = {
  projects: Project[];
  users: TaskUser[];
  sessionUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
};

function toTaskUser(user: NonNullable<UseTaskEditorArgs["sessionUser"]>) {
  const name = user.name || "Me";
  return {
    id: user.id,
    name,
    email: user.email || "",
    avatarUrl: user.image || undefined,
    role: "member",
    initials: user.name ? getPersonInitials(name) : "ME",
  };
}

export type TaskEditor = {
  selectedTask: TaskItem | null;
  isDrawerOpen: boolean;
  openTask: (task: TaskItem) => void;
  openDraft: (status: TaskStatus, teamId: string, projectId: string) => void;
  saveTask: (item: TaskItem) => Promise<boolean>;
  closeDrawer: () => void;
};

/** Drawer state plus create/update persistence for a single task. */
export function useTaskEditor({
  projects,
  users,
  sessionUser,
  setTasks,
}: UseTaskEditorArgs): TaskEditor {
  const [selectedTask, setSelectedTask] = React.useState<TaskItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const openTask = React.useCallback((task: TaskItem) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  }, []);

  const openDraft = (status: TaskStatus, teamId: string, projectId: string) => {
    const currentUser =
      users.find((u) => u.id === sessionUser?.id) ||
      (sessionUser ? toTaskUser(sessionUser) : users[0] || null);
    const project = projects.find((p) => p.id === projectId) || null;
    openTask(
      createDraftTask(
        status,
        teamId,
        sessionUser?.id || users[0]?.id || "",
        project,
        currentUser,
      ),
    );
  };

  /** Resolves true once persisted; on failure toasts and resolves false (drawer stays open). */
  const saveTask = async (item: TaskItem): Promise<boolean> => {
    const payload = {
      ...item,
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null,
      estimatedMinutes: item.estimatedMinutes ?? 60,
    };
    const isDraft = item.id.startsWith("draft-");
    try {
      const res = isDraft
        ? await createTaskAction(payload)
        : await updateTaskAction(item.id, payload);
      if (!res.success) {
        toast.error(res.error ?? "Failed to save task");
        return false;
      }
      if (isDraft && res.data) {
        const created = res.data;
        const proj = projects.find((p) => p.id === created.projectId) || null;
        setTasks((prev) => [
          {
            ...created,
            assignee: item.assignee,
            creator: null,
            project: proj,
            totalSpentSeconds: 0,
            activeSessionStartedAt:
              item.status === "in_progress" ? new Date().toISOString() : null,
          },
          ...prev,
        ]);
      } else if (!isDraft) {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== item.id) return t;
            const { totalSpentSeconds, activeSessionStartedAt } = withStatus(
              t,
              item.status as TaskStatus,
            );
            return { ...item, totalSpentSeconds, activeSessionStartedAt };
          }),
        );
      }
      return true;
    } catch {
      toast.error("Failed to save task");
      return false;
    }
  };

  return {
    selectedTask,
    isDrawerOpen,
    openTask,
    openDraft,
    saveTask,
    closeDrawer: () => setIsDrawerOpen(false),
  };
}
