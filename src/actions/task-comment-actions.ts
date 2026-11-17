"use server";

import { TaskService } from "@/services/task/task-service";
import { TeamService } from "@/services/team/team-service";
import type { TaskCommentWithSource } from "@/services/task/workspace-types";
import { CreateTaskCommentPayloadSchema } from "./schemas";
import { resolveActionUserId, type ActionResult } from "./auth-helper";

export async function getTaskCommentsAction(
  taskId: string,
): Promise<ActionResult<TaskCommentWithSource[]>> {
  try {
    if (!taskId) return { success: false, error: "Task ID is required" };
    const userId = await resolveActionUserId();
    const existingTask = await TaskService.getTaskById(taskId);
    if (!existingTask) {
      return { success: false, error: "Task not found" };
    }
    const isMember = await TeamService.isTeamMember(
      existingTask.teamId,
      userId,
    );
    if (!isMember) {
      return { success: false, error: "Access denied" };
    }

    const comments = await TaskService.getTaskComments(taskId, userId);
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
}): Promise<ActionResult<TaskCommentWithSource>> {
  try {
    const parseResult = CreateTaskCommentPayloadSchema.safeParse(payload);
    if (!parseResult.success)
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };

    const userId = await resolveActionUserId();
    const existingTask = await TaskService.getTaskById(parseResult.data.taskId);
    if (!existingTask) {
      return { success: false, error: "Task not found" };
    }
    const access = await TaskService.getWriteAccess(existingTask, userId);
    if (access === "not_member") {
      return { success: false, error: "Access denied" };
    }
    if (access === "forbidden") {
      return {
        success: false,
        error: "Permission denied: viewers cannot comment on tasks",
      };
    }

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
