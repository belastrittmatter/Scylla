"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, task, project, teamMember } from "@/db";
import { TaskService } from "@/services/task/task-service";
import { ProjectService } from "@/services/project/project-service";
import { checkTaskTransitionAllowed } from "@/services/task/task-rules-server";
import type { Task, Project, TaskComment } from "@/db/schema";
import type { TaskCommentItem } from "@/components/tasks/task-types";
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
import { resolveActionUserId, type ActionResult } from "./auth-helper";

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

    // Enforce Git workflow and permission transition rules
    const [existingTask] = await db
      .select()
      .from(task)
      .where(eq(task.id, idParse.data))
      .limit(1);

    if (existingTask) {
      let isProjectLinkedToGithub = false;
      if (existingTask.projectId) {
        const [proj] = await db
          .select()
          .from(project)
          .where(eq(project.id, existingTask.projectId))
          .limit(1);
        isProjectLinkedToGithub = Boolean(proj?.githubRepo?.trim());
      }

      let userTeamRole: string | undefined;
      if (userId && existingTask.teamId) {
        const [memberRow] = await db
          .select()
          .from(teamMember)
          .where(
            and(
              eq(teamMember.teamId, existingTask.teamId),
              eq(teamMember.userId, userId),
            ),
          )
          .limit(1);
        userTeamRole = memberRow?.role;
      }

      const { validateTaskTransitionRule } =
        await import("@/services/task/task-rules");
      const validation = validateTaskTransitionRule({
        task: existingTask,
        targetStatus: statusParse.data.status,
        currentUser: userId ? { id: userId } : null,
        currentTeamRole: userTeamRole,
        isProjectLinkedToGithub,
      });

      if (!validation.allowed) {
        return {
          success: false,
          error: validation.reason || "Status transition not allowed by rules",
        };
      }
    }

    const updated = await TaskService.updateTask(
      idParse.data,
      { status: statusParse.data.status },
      userId ?? undefined,
    );

    try {
      const { GithubIntegrationService } =
        await import("@/services/github/github-integration-service");
      await GithubIntegrationService.syncTaskToGitHub(
        idParse.data,
        { status: statusParse.data.status },
        userId ?? undefined,
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

    if (parsedData.status) {
      const ruleCheck = await checkTaskTransitionAllowed(
        idParse.data,
        parsedData.status,
        userId,
      );
      if (!ruleCheck.allowed) {
        return {
          success: false,
          error:
            ruleCheck.reason || "Transition not permitted by workflow rules",
        };
      }
    }

    const updated = await TaskService.updateTask(
      idParse.data,
      { ...parsedData, dueDate },
      userId ?? undefined,
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
        userId ?? undefined,
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
  payload: CreateProjectActionPayload,
): Promise<ActionResult<Project>> {
  try {
    const parseResult = CreateProjectPayloadSchema.safeParse(payload);
    if (!parseResult.success)
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };

    let targetGithubRepo = parseResult.data.githubRepo?.trim() || null;

    // Unified creation: If user selected create new repo, create & setup repo on GitHub first
    if (parseResult.data.createNewRepo) {
      const { validateGithubRepoName } =
        await import("@/lib/github-validation");
      const validation = validateGithubRepoName(
        parseResult.data.createNewRepo.name,
      );
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || "Invalid GitHub repository name",
        };
      }

      const userId = await resolveActionUserId();
      const { GithubSyncService } =
        await import("@/services/github/github-sync-service");
      const createdRepo = await GithubSyncService.createAndSetupRepository(
        {
          name: validation.cleanName,
          description:
            parseResult.data.createNewRepo.description ||
            parseResult.data.description,
          isPrivate: parseResult.data.createNewRepo.isPrivate,
          projectName: parseResult.data.name,
        },
        userId,
      );

      targetGithubRepo = createdRepo.fullName;
    }

    const created = await ProjectService.createProject({
      name: parseResult.data.name,
      teamId: parseResult.data.teamId,
      description: parseResult.data.description ?? undefined,
      color: parseResult.data.color ?? undefined,
      githubRepo: targetGithubRepo ?? undefined,
      status: "active",
    });

    if (targetGithubRepo) {
      try {
        const userId = await resolveActionUserId().catch(() => null);
        if (userId) {
          const { GithubIntegrationService } =
            await import("@/services/github/github-integration-service");
          await GithubIntegrationService.inviteTeamCollaborators(
            parseResult.data.teamId,
            targetGithubRepo,
            userId,
          );
        }
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

export async function createGithubRepositoryAction(payload: {
  name: string;
  description?: string | null;
  isPrivate?: boolean;
  projectName?: string;
}): Promise<
  ActionResult<
    import("@/services/github/github-sync-service").CreatedRepositoryResult
  >
> {
  try {
    const userId = await resolveActionUserId();
    const { GithubSyncService } =
      await import("@/services/github/github-sync-service");
    const result = await GithubSyncService.createAndSetupRepository(
      payload,
      userId,
    );
    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to create GitHub repository",
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
    const userId = await resolveActionUserId().catch(() => undefined);
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
