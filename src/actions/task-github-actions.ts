"use server";

import { TaskService } from "@/services/task/task-service";
import { ProjectService } from "@/services/project/project-service";
import { GithubIntegrationService } from "@/services/github/github-integration-service";
import type {
  CreateBranchResult,
  GithubIssueResult,
  TaskDevelopmentInfo,
} from "@/services/github/github-types";
import { resolveActionUserId, type ActionResult } from "./auth-helper";

const VIEWER_DENIED = "Permission denied: viewers cannot change GitHub links";
const NOT_LINKED = "Task is not linked to a GitHub repository";

/** Fails (throws a message-only Error) unless the session user may use the task. */
async function authorizeTask(taskId: string, write: boolean) {
  if (!taskId) throw new Error("Task ID is required");
  const userId = await resolveActionUserId();
  const existing = await TaskService.getTaskById(taskId);
  if (!existing) throw new Error("Task not found");
  const access = await TaskService.getWriteAccess(existing, userId);
  if (access === "not_member") throw new Error("Access denied");
  if (write) {
    if (access === "forbidden") throw new Error(VIEWER_DENIED);
    if (!existing.githubRepo) {
      const proj = existing.projectId
        ? await ProjectService.getProjectById(existing.projectId)
        : null;
      if (!proj?.githubRepo?.trim()) throw new Error(NOT_LINKED);
    }
  }
  return { userId, existing };
}

function failure<T>(err: unknown, fallback: string): ActionResult<T> {
  return {
    success: false,
    error: err instanceof Error ? err.message : fallback,
  };
}

export async function getTaskDevelopmentAction(
  taskId: string,
): Promise<ActionResult<TaskDevelopmentInfo>> {
  try {
    const { userId } = await authorizeTask(taskId, false);
    const info = await GithubIntegrationService.getTaskDevelopmentInfo(
      taskId,
      userId,
    );
    if (!info) return { success: false, error: "Task not found" };
    return { success: true, data: info };
  } catch (err) {
    return failure(err, "Failed to load development info");
  }
}

export async function createTaskBranchAction(
  taskId: string,
  branchName?: string,
): Promise<ActionResult<CreateBranchResult>> {
  try {
    const { userId } = await authorizeTask(taskId, true);
    const data = await GithubIntegrationService.createBranchForTask(
      taskId,
      userId,
      branchName,
    );
    return { success: true, data };
  } catch (err) {
    return failure(err, "Failed to create branch");
  }
}

export async function createTaskIssueAction(
  taskId: string,
): Promise<ActionResult<GithubIssueResult>> {
  try {
    const { userId } = await authorizeTask(taskId, true);
    const data = await GithubIntegrationService.createIssueForTask(
      taskId,
      userId,
    );
    if (!data)
      return { success: false, error: "Failed to create GitHub issue" };
    return { success: true, data };
  } catch (err) {
    return failure(err, "Failed to create GitHub issue");
  }
}
