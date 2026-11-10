"use server";

import { z } from "zod";
import { TaskService } from "@/services/task/task-service";
import { ProjectService } from "@/services/project/project-service";
import { TeamService } from "@/services/team/team-service";
import { hasTeamRole } from "@/services/team/team-types";
import type { Task, Project } from "@/db/schema";
import type {
  WorkspaceData,
  TaskUser,
  CreateTaskActionPayload,
  UpdateTaskActionPayload,
  CreateProjectActionPayload,
} from "./task-action-types";
import { resolveActionUserId, type ActionResult } from "./auth-helper";
import {
  UpdateTaskPayloadSchema,
  CreateProjectPayloadSchema,
  UpdateTaskStatusSchema,
} from "./schemas";
import {
  checkTaskStatusTransitionAllowed,
  handleProjectGithubSetup,
} from "./task-action-helpers";

export type {
  WorkspaceData,
  TaskUser,
  CreateTaskActionPayload,
  UpdateTaskActionPayload,
  CreateProjectActionPayload,
};

export {
  createTaskAction,
  getTaskCommentsAction,
  createTaskCommentAction,
  deleteTaskAction,
} from "./task-crud-actions";

export { createGithubRepositoryAction } from "./project-github-action";

export async function getWorkspaceDataAction(): Promise<
  ActionResult<WorkspaceData>
> {
  try {
    const userId = await resolveActionUserId();
    const data = await TaskService.getWorkspaceData(userId);
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
  newStatus: string,
): Promise<ActionResult<Task>> {
  try {
    const idParse = z.string().min(1, "Task ID is required").safeParse(taskId);
    if (!idParse.success)
      return { success: false, error: idParse.error.issues[0]?.message };

    const statusParse = UpdateTaskStatusSchema.safeParse({ status: newStatus });
    if (!statusParse.success)
      return {
        success: false,
        error: statusParse.error.issues
          .map((i: z.ZodIssue) => i.message)
          .join(", "),
      };

    const userId = await resolveActionUserId();
    const transitionCheck = await checkTaskStatusTransitionAllowed(
      idParse.data,
      statusParse.data.status,
      userId,
    );
    if (!transitionCheck.allowed) {
      return {
        success: false,
        error: transitionCheck.reason || "Status transition not allowed",
      };
    }

    const updated = await TaskService.updateTask(
      idParse.data,
      { status: statusParse.data.status },
      userId,
    );

    try {
      const { GithubIntegrationService } =
        await import("@/services/github/github-integration-service");
      await GithubIntegrationService.syncTaskToGitHub(
        idParse.data,
        { status: statusParse.data.status },
        userId,
      );
    } catch (syncErr) {
      console.warn("GitHub issue sync on status update failed:", syncErr);
    }

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
  data: UpdateTaskActionPayload,
): Promise<ActionResult<Task>> {
  try {
    const idParse = z.string().min(1, "Task ID is required").safeParse(taskId);
    if (!idParse.success)
      return { success: false, error: idParse.error.issues[0]?.message };

    const parseResult = UpdateTaskPayloadSchema.safeParse(data);
    if (!parseResult.success)
      return {
        success: false,
        error: parseResult.error.issues
          .map((i: z.ZodIssue) => i.message)
          .join(", "),
      };

    const parsedData = parseResult.data;
    const dueDate =
      parsedData.dueDate === null
        ? null
        : parsedData.dueDate
          ? new Date(parsedData.dueDate)
          : undefined;

    const userId = await resolveActionUserId();
    const existingTask = await TaskService.getTaskById(idParse.data);
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
    if (
      parsedData.assigneeId &&
      !(await TeamService.isTeamMember(
        existingTask.teamId,
        parsedData.assigneeId,
      ))
    ) {
      return { success: false, error: "Assignee must be a member of the team" };
    }

    const updated = await TaskService.updateTask(
      idParse.data,
      { ...parsedData, dueDate },
      userId,
    );

    try {
      const { GithubIntegrationService } =
        await import("@/services/github/github-integration-service");
      await GithubIntegrationService.syncTaskToGitHub(
        idParse.data,
        {
          title: parsedData.title,
          description: parsedData.description,
          status: parsedData.status,
          priority: parsedData.priority,
          assigneeId: parsedData.assigneeId,
        },
        userId,
      );
    } catch (syncErr) {
      console.warn("GitHub issue sync on task update failed:", syncErr);
    }

    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update task",
    };
  }
}

export async function createProjectAction(
  data: CreateProjectActionPayload,
): Promise<ActionResult<Project>> {
  try {
    const parseResult = CreateProjectPayloadSchema.safeParse(data);
    if (!parseResult.success)
      return {
        success: false,
        error: parseResult.error.issues
          .map((i: z.ZodIssue) => i.message)
          .join(", "),
      };

    const userId = await resolveActionUserId();
    const teamId = await TeamService.resolveTeamId(parseResult.data.teamId);
    const role = teamId ? await TeamService.getUserRole(teamId, userId) : null;
    if (!teamId || !role) {
      return { success: false, error: "Access denied" };
    }
    if (!hasTeamRole(role, "admin")) {
      return {
        success: false,
        error: "Permission denied: Team owner or admin role required",
      };
    }

    let targetGithubRepo = parseResult.data.githubRepo?.trim() || null;

    if (parseResult.data.createNewRepo) {
      try {
        targetGithubRepo = await handleProjectGithubSetup(
          parseResult.data.name,
          parseResult.data.description,
          {
            ...parseResult.data.createNewRepo,
            description:
              parseResult.data.createNewRepo.description ?? undefined,
          },
          userId,
        );
      } catch (repoErr) {
        return {
          success: false,
          error:
            repoErr instanceof Error
              ? repoErr.message
              : "Failed to setup GitHub repository",
        };
      }
    }

    const created = await ProjectService.createProject({
      name: parseResult.data.name,
      teamId,
      description: parseResult.data.description ?? undefined,
      color: parseResult.data.color ?? undefined,
      githubRepo: targetGithubRepo ?? undefined,
      status: "active",
    });

    if (targetGithubRepo) {
      try {
        const { GithubIntegrationService } =
          await import("@/services/github/github-integration-service");
        await GithubIntegrationService.inviteTeamCollaborators(
          teamId,
          targetGithubRepo,
          userId,
        );
      } catch (inviteErr) {
        console.warn(
          "Failed to auto-invite team collaborators to GitHub repo:",
          inviteErr,
        );
      }

      try {
        const { GithubSyncService } =
          await import("@/services/github/github-sync-service");
        await GithubSyncService.syncProjectIssues(created.id);
      } catch (syncErr) {
        console.error("Initial GitHub issue sync failed:", syncErr);
      }
    }

    return { success: true, data: created };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create project",
    };
  }
}
