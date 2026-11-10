import { db } from "@/db";
import { task, team, project, type Task } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskFilterInput,
  type TaskWithRelations,
  type TaskStatus,
} from "./task-types";
import {
  TaskSessionService,
  MIN_TASK_SESSION_DURATION_SECONDS,
} from "./task-session-service";
import { TaskQueryService } from "./task-query-service";
import { TeamService } from "@/services/team/team-service";
import {
  validateCreateTaskGithubRules,
  validateUpdateTaskGithubRules,
  populateTaskGithubFields,
} from "./task-mutation-helper";
import {
  assertTaskCreationAccess,
  assertAssigneeBelongsToTeam,
} from "./task-validation-helper";

import {
  TaskAccessService,
  TaskAccessError,
  type TaskWriteAccess,
} from "./task-access-service";

export type { TaskWriteAccess };
export { TaskAccessError, MIN_TASK_SESSION_DURATION_SECONDS };

export class TaskService {
  public static async createTask(input: CreateTaskInput): Promise<Task> {
    const validated = CreateTaskSchema.parse(input);

    const [teamRecord, projectRecord, existing] = await Promise.all([
      db.query.team.findFirst({
        where: eq(team.id, validated.teamId),
      }),
      validated.projectId
        ? db.query.project.findFirst({
            where: eq(project.id, validated.projectId),
          })
        : Promise.resolve(null),
      validated.position === undefined
        ? db
            .select({ position: task.position })
            .from(task)
            .where(
              and(
                eq(task.teamId, validated.teamId),
                eq(task.status, validated.status),
              ),
            )
            .orderBy(desc(task.position))
            .limit(1)
        : Promise.resolve([]),
    ]);

    if (!teamRecord) {
      throw new Error(`Team with id "${validated.teamId}" not found`);
    }

    await assertTaskCreationAccess(validated.teamId, validated.creatorId);
    if (
      validated.projectId &&
      (!projectRecord || projectRecord.teamId !== validated.teamId)
    ) {
      throw new Error(
        `Project with id "${validated.projectId}" not found in team "${validated.teamId}"`,
      );
    }
    if (validated.assigneeId) {
      await assertAssigneeBelongsToTeam(validated.teamId, validated.assigneeId);
      await validateCreateTaskGithubRules(
        validated.assigneeId,
        projectRecord?.githubRepo,
      );
    }

    const position =
      validated.position !== undefined
        ? validated.position
        : existing.length > 0
          ? existing[0].position + 1
          : 0;

    const taskValues: typeof task.$inferInsert = {
      title: validated.title,
      description: validated.description,
      status: validated.status,
      priority: validated.priority,
      teamId: validated.teamId,
      projectId: validated.projectId,
      creatorId: validated.creatorId,
      assigneeId: validated.assigneeId,
      dueDate: validated.dueDate,
      position,
      estimatedMinutes: validated.estimatedMinutes ?? 60,
    };
    populateTaskGithubFields(taskValues, validated);

    const [newTask] = await db.insert(task).values(taskValues).returning();

    if (validated.status === "in_progress") {
      await TaskSessionService.startTaskSession(
        newTask.id,
        validated.creatorId,
      );
    }

    return newTask;
  }

  public static async getTaskById(
    taskId: string,
  ): Promise<TaskWithRelations | null> {
    return TaskQueryService.getTaskById(taskId);
  }

  public static async listTasks(filter: TaskFilterInput): Promise<Task[]> {
    return TaskQueryService.listTasks(filter);
  }

  public static async updateTask(
    taskId: string,
    input: UpdateTaskInput,
    currentUserId: string,
  ): Promise<Task> {
    const validated = UpdateTaskSchema.parse(input);

    const existing = await db.query.task.findFirst({
      where: eq(task.id, taskId),
    });
    if (!existing) throw new Error(`Task with id "${taskId}" not found`);

    await TaskService.assertWriteAccess(
      existing,
      currentUserId,
      "Forbidden: Viewer role cannot update tasks",
    );

    if (validated.projectId !== undefined && validated.projectId !== null) {
      const projectRecord = await db.query.project.findFirst({
        where: eq(project.id, validated.projectId),
      });
      if (!projectRecord || projectRecord.teamId !== existing.teamId) {
        throw new Error(
          `Project with id "${validated.projectId}" not found in team "${existing.teamId}"`,
        );
      }
    }

    if (validated.assigneeId !== undefined && validated.assigneeId !== null) {
      const isMember = await TeamService.isTeamMember(
        existing.teamId,
        validated.assigneeId,
      );
      if (!isMember) {
        throw new Error(
          `User "${validated.assigneeId}" is not a member of team "${existing.teamId}"`,
        );
      }
      await validateUpdateTaskGithubRules(
        validated.assigneeId,
        validated.projectId || existing.projectId,
      );
    }

    if (
      validated.status !== undefined &&
      validated.status !== existing.status
    ) {
      if (validated.status === "in_progress") {
        await TaskSessionService.startTaskSession(taskId, currentUserId);
      } else if (existing.status === "in_progress") {
        await TaskSessionService.stopTaskSession(
          taskId,
          MIN_TASK_SESSION_DURATION_SECONDS,
        );
      }
    }

    const updateData: Partial<typeof task.$inferInsert> = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.priority !== undefined)
      updateData.priority = validated.priority;
    if (validated.projectId !== undefined)
      updateData.projectId = validated.projectId;
    if (validated.assigneeId !== undefined)
      updateData.assigneeId = validated.assigneeId;
    if (validated.dueDate !== undefined) updateData.dueDate = validated.dueDate;
    if (validated.position !== undefined)
      updateData.position = validated.position;
    if (validated.estimatedMinutes !== undefined)
      updateData.estimatedMinutes = validated.estimatedMinutes;
    populateTaskGithubFields(updateData, validated);

    const [updated] = await db
      .update(task)
      .set(updateData)
      .where(eq(task.id, taskId))
      .returning();
    return updated;
  }

  public static async startTaskSession(taskId: string, userId?: string | null) {
    return TaskSessionService.startTaskSession(taskId, userId);
  }

  public static async stopTaskSession(
    taskId: string,
    minDurationSeconds = MIN_TASK_SESSION_DURATION_SECONDS,
  ) {
    return TaskSessionService.stopTaskSession(taskId, minDurationSeconds);
  }

  public static async getTaskTimeSessions(taskId: string) {
    return TaskSessionService.getTaskTimeSessions(taskId);
  }

  public static async getWriteAccess(
    target: Pick<Task, "teamId">,
    userId: string,
  ): Promise<TaskWriteAccess> {
    return TaskAccessService.getWriteAccess(target, userId);
  }

  public static async assertWriteAccess(
    target: Pick<Task, "id" | "teamId">,
    userId: string,
    forbiddenMessage: string,
  ): Promise<void> {
    return TaskAccessService.assertWriteAccess(
      target,
      userId,
      forbiddenMessage,
    );
  }

  public static async deleteTask(
    taskId: string,
    currentUserId: string,
  ): Promise<boolean> {
    const existing = await db.query.task.findFirst({
      where: eq(task.id, taskId),
      columns: { id: true, teamId: true },
    });
    if (!existing) return false;
    await TaskService.assertWriteAccess(
      existing,
      currentUserId,
      "Permission denied: only team members (not viewers) can delete tasks",
    );
    const deleted = await db
      .delete(task)
      .where(eq(task.id, taskId))
      .returning();
    return deleted.length > 0;
  }

  public static async reorderTaskPositions(
    updates: Array<{ id: string; position: number; status?: TaskStatus }>,
  ): Promise<void> {
    return TaskQueryService.reorderTaskPositions(updates);
  }

  public static async getWorkspaceData(currentUserId?: string) {
    const { TaskWorkspaceService } = await import("./task-workspace-service");
    return TaskWorkspaceService.getWorkspaceData(currentUserId);
  }

  public static async getTaskComments(taskId: string, userId?: string) {
    const { TaskWorkspaceService } = await import("./task-workspace-service");
    return TaskWorkspaceService.getTaskComments(taskId, userId);
  }

  public static async createTaskComment(payload: {
    taskId: string;
    userId: string;
    content: string;
  }) {
    const { TaskWorkspaceService } = await import("./task-workspace-service");
    return TaskWorkspaceService.createTaskComment(payload);
  }
}
