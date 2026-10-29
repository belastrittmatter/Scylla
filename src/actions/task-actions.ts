"use server";

import { z } from "zod";
import { TaskService } from "@/services/task/task-service";
import { ProjectService } from "@/services/project/project-service";
import type { Task, Project, TaskComment } from "@/db/schema";
import type {
  WorkspaceData,
  TaskUser,
  CreateTaskActionPayload,
  UpdateTaskActionPayload,
  CreateProjectActionPayload,
} from "./task-action-types";
import {
  UpdateTaskStatusSchema,
  UpdateTaskPayloadSchema,
  CreateProjectPayloadSchema,
  CreateTaskPayloadSchema,
  CreateTaskCommentPayloadSchema,
} from "./schemas";
import {
  getSessionUserId,
  resolveActionUserId,
  type ActionResult,
} from "./auth-helper";

export async function getWorkspaceDataAction(): Promise<
  ActionResult<WorkspaceData>
> {
  try {
    const userId = await getSessionUserId();
    const data = await TaskService.getWorkspaceData(userId || undefined);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to load workspace data",
    };
  }
}

export async function updateTaskStatusAction(
  taskId: string,
  status: string,
): Promise<ActionResult<Task>> {
  try {
    const idParse = z.string().min(1, "Task ID is required").safeParse(taskId);
    if (!idParse.success)
      return {
        success: false,
        error: idParse.error.issues.map((i) => i.message).join(", "),
      };

    const statusParse = UpdateTaskStatusSchema.safeParse({ status });
    if (!statusParse.success)
      return {
        success: false,
        error: statusParse.error.issues.map((i) => i.message).join(", "),
      };

    const userId = await resolveActionUserId().catch(() => null);
    const updated = await TaskService.updateTask(
      idParse.data,
      { status: statusParse.data.status },
      userId ?? undefined,
    );
    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to update task status",
    };
  }
}

export async function updateTaskAction(
  taskId: string,
  payload: UpdateTaskActionPayload,
): Promise<ActionResult<Task>> {
  try {
    const idParse = z.string().min(1, "Task ID is required").safeParse(taskId);
    if (!idParse.success)
      return {
        success: false,
        error: idParse.error.issues.map((i) => i.message).join(", "),
      };

    const payloadParse = UpdateTaskPayloadSchema.safeParse(payload);
    if (!payloadParse.success)
      return {
        success: false,
        error: payloadParse.error.issues.map((i) => i.message).join(", "),
      };

    const parsedData = payloadParse.data;
    const dueDate = parsedData.dueDate
      ? new Date(parsedData.dueDate)
      : parsedData.dueDate === null
        ? null
        : undefined;

    const userId = await resolveActionUserId().catch(() => null);
    const updated = await TaskService.updateTask(
      idParse.data,
      { ...parsedData, dueDate },
      userId ?? undefined,
    );
    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update task",
    };
  }
}

export async function createProjectAction(
  payload: CreateProjectActionPayload,
): Promise<ActionResult<Project>> {
  try {
    const parseResult = CreateProjectPayloadSchema.safeParse(payload);
    if (!parseResult.success)
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };

    const created = await ProjectService.createProject({
      name: parseResult.data.name,
      teamId: parseResult.data.teamId,
      description: parseResult.data.description ?? undefined,
      color: parseResult.data.color ?? undefined,
      status: "active",
    });
    return { success: true, data: created };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create project",
    };
  }
}

export async function createTaskAction(
  payload: CreateTaskActionPayload,
): Promise<ActionResult<Task>> {
  try {
    const parseResult = CreateTaskPayloadSchema.safeParse(payload);
    if (!parseResult.success)
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };

    const creatorId = await resolveActionUserId();
    const parsedData = parseResult.data;
    const dueDate = parsedData.dueDate
      ? new Date(parsedData.dueDate)
      : parsedData.dueDate === null
        ? null
        : undefined;

    const created = await TaskService.createTask({
      title: parsedData.title,
      description: parsedData.description ?? undefined,
      status: parsedData.status ?? "todo",
      priority: parsedData.priority ?? "medium",
      teamId: parsedData.teamId,
      projectId: parsedData.projectId ?? undefined,
      creatorId,
      assigneeId: parsedData.assigneeId ?? null,
      dueDate,
      estimatedMinutes: parsedData.estimatedMinutes ?? 60,
    });
    return { success: true, data: created };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create task",
    };
  }
}

export async function getTaskCommentsAction(
  taskId: string,
): Promise<ActionResult<Array<TaskComment & { user: TaskUser | null }>>> {
  try {
    if (!taskId) return { success: false, error: "Task ID is required" };
    const comments = await TaskService.getTaskComments(taskId);
    return { success: true, data: comments };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to fetch task comments",
    };
  }
}

export async function createTaskCommentAction(payload: {
  taskId: string;
  content: string;
}): Promise<ActionResult<TaskComment & { user: TaskUser | null }>> {
  try {
    const parseResult = CreateTaskCommentPayloadSchema.safeParse(payload);
    if (!parseResult.success)
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };

    const userId = await resolveActionUserId();
    const comment = await TaskService.createTaskComment({
      taskId: parseResult.data.taskId,
      userId,
      content: parseResult.data.content,
    });
    return { success: true, data: comment };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add comment",
    };
  }
}
