import type { TaskUser, TaskWithDetails, WorkspaceData } from "@/services/task/task-types";

export type { TaskUser, TaskWithDetails, WorkspaceData };

export interface UpdateTaskActionPayload {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  dueDate?: string | Date | null;
  position?: number;
  estimatedMinutes?: number | null;
}

export interface CreateProjectActionPayload {
  teamId: string;
  name: string;
  description?: string | null;
  color?: string | null;
}

export interface CreateTaskActionPayload {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  teamId: string;
  projectId?: string | null;
  assigneeId?: string | null;
  dueDate?: string | Date | null;
  estimatedMinutes?: number | null;
}
