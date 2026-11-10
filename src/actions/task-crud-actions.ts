"use server";

import { z } from "zod";
import { TaskService } from "@/services/task/task-service";
import type { Task, TaskComment } from "@/db/schema";
import type { TaskCommentItem } from "@/components/tasks/task-types";
import type { TaskUser, CreateTaskActionPayload } from "./task-action-types";
import { resolveActionUserId, type ActionResult } from "./auth-helper";
import {
  CreateTaskPayloadSchema,
  CreateTaskCommentPayloadSchema,
} from "./schemas";
import { TeamService } from "@/services/team/team-service";

const ASSIGNEE_NOT_MEMBER = "Assignee must be a member of the team";

export async function createTaskAction(
  data: CreateTaskActionPayload,
): Promise<ActionResult<Task>> {
  try {
    const parseResult = CreateTaskPayloadSchema.safeParse(data);
    if (!parseResult.success)
      return {
        success: false,
        error: parseResult.error.issues
          .map((i: z.ZodIssue) => i.message)
          .join(", "),
      };

    const creatorId = await resolveActionUserId();
    const teamId = await TeamService.resolveTeamId(parseResult.data.teamId);
    if (!teamId || !(await TeamService.isTeamMember(teamId, creatorId))) {
      return { success: false, error: "Access denied" };
    }

    const parsedData = parseResult.data;
    if (
      parsedData.assigneeId &&
      !(await TeamService.isTeamMember(teamId, parsedData.assigneeId))
    ) {
      return { success: false, error: ASSIGNEE_NOT_MEMBER };
    }

    const dueDate = parsedData.dueDate
      ? new Date(parsedData.dueDate)
      : undefined;

    const created = await TaskService.createTask({
      title: parsedData.title,
      description: parsedData.description ?? undefined,
      status: parsedData.status ?? "todo",
      priority: parsedData.priority ?? "medium",
      teamId,
      projectId: parsedData.projectId ?? undefined,
      creatorId,
      assigneeId: parsedData.assigneeId ?? null,
      dueDate,
      estimatedMinutes: parsedData.estimatedMinutes ?? 60,
    });

    if (created.projectId) {
      try {
        const { GithubIntegrationService } =
          await import("@/services/github/github-integration-service");
        const issueRes = await GithubIntegrationService.createIssueForTask(
          created.id,
          creatorId,
        );
        if (issueRes) {
          created.githubIssueNumber = issueRes.number;
          created.githubIssueUrl = issueRes.url;
          created.githubBranch = issueRes.branchName;
        }
      } catch (issueErr) {
        console.error("Auto GitHub issue creation failed:", issueErr);
      }
    }

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
): Promise<ActionResult<TaskCommentItem[]>> {
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

    const comments = (await TaskService.getTaskComments(
      taskId,
      userId,
    )) as TaskCommentItem[];
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
        error: parseResult.error.issues
          .map((i: z.ZodIssue) => i.message)
          .join(", "),
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

export async function deleteTaskAction(
  taskId: string,
): Promise<ActionResult<boolean>> {
  try {
    if (!taskId) return { success: false, error: "Task ID is required" };
    const userId = await resolveActionUserId();
    const deleted = await TaskService.deleteTask(taskId, userId);
    return { success: true, data: deleted };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete task",
    };
  }
}
