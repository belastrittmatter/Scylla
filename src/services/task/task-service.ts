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
import {
  TaskAccessError,
  assertWriteAccess,
  getWriteAccess,
  type TaskWriteAccess,
} from "./task-access-service";
import {
  TaskAssigneeGithubError,
  assertAssigneeGithubRule,
  assertAssigneeInTeam,
  assertProjectInTeam,
} from "./task-assignee-rules";
import {
  createIssueIfLinked,
  pushTaskChangesToGithub,
} from "./task-github-hooks";
import { TaskDateRangeError, assertDateOrder, keepIfUnset } from "./task-rules";
import type { TaskCommentWithSource } from "./workspace-types";

export {
  MIN_TASK_SESSION_DURATION_SECONDS,
  TaskAccessError,
  TaskAssigneeGithubError,
  TaskDateRangeError,
  type TaskWriteAccess,
};

export class TaskService {
  public static async createTask(input: CreateTaskInput): Promise<Task> {
    const validated = CreateTaskSchema.parse(input);
    assertDateOrder(validated.startDate, validated.dueDate);

    const [teamRecord, projectRecord, existing] = await Promise.all([
      db.query.team.findFirst({ where: eq(team.id, validated.teamId) }),
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

    if (validated.creatorId) {
      const access = await TaskService.getWriteAccess(
        validated,
        validated.creatorId,
      );
      if (access !== "allowed") {
        throw new Error(
          access === "forbidden"
            ? "Forbidden: Viewer role cannot create tasks"
            : "Forbidden: Creator is not a member of this team",
        );
      }
    }

    if (validated.projectId) {
      assertProjectInTeam(projectRecord, validated.projectId, validated.teamId);
    }
    if (validated.assigneeId) {
      await assertAssigneeInTeam(validated.teamId, validated.assigneeId);
    }

    await assertAssigneeGithubRule(validated.projectId, validated.assigneeId);

    const position =
      validated.position !== undefined
        ? validated.position
        : existing.length > 0
          ? existing[0].position + 1
          : 0;

    const [newTask] = await db
      .insert(task)
      .values({
        title: validated.title,
        description: validated.description,
        status: validated.status,
        priority: validated.priority,
        teamId: validated.teamId,
        projectId: validated.projectId,
        creatorId: validated.creatorId,
        assigneeId: validated.assigneeId,
        dueDate: validated.dueDate,
        startDate: validated.startDate ?? null,
        position,
        estimatedMinutes: validated.estimatedMinutes ?? 60,
      })
      .returning();

    if (validated.status === "in_progress") {
      await TaskSessionService.startTaskSession(
        newTask.id,
        validated.creatorId,
      );
    }

    return createIssueIfLinked(newTask, validated.creatorId);
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

    assertDateOrder(
      keepIfUnset(validated.startDate, existing.startDate),
      keepIfUnset(validated.dueDate, existing.dueDate),
    );

    if (validated.projectId !== undefined && validated.projectId !== null) {
      const projectRecord = await db.query.project.findFirst({
        where: eq(project.id, validated.projectId),
      });
      assertProjectInTeam(projectRecord, validated.projectId, existing.teamId);
    }

    if (validated.assigneeId !== undefined && validated.assigneeId !== null) {
      await assertAssigneeInTeam(existing.teamId, validated.assigneeId);
    }

    const effectiveAssignee = keepIfUnset(
      validated.assigneeId,
      existing.assigneeId,
    );
    const effectiveProject = keepIfUnset(
      validated.projectId,
      existing.projectId,
    );
    if (
      effectiveAssignee &&
      (effectiveAssignee !== existing.assigneeId ||
        effectiveProject !== existing.projectId)
    ) {
      await assertAssigneeGithubRule(effectiveProject, effectiveAssignee);
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

    const updateData = Object.fromEntries(
      Object.entries(validated).filter(([, v]) => v !== undefined),
    ) as Partial<typeof task.$inferInsert>;

    const [updated] = await db
      .update(task)
      .set(updateData)
      .where(eq(task.id, taskId))
      .returning();
    await pushTaskChangesToGithub(existing, updated, validated, currentUserId);
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

  /** Single write-permission check for create/update/delete (see task-permissions). */
  public static getWriteAccess(
    target: Pick<Task, "teamId">,
    userId: string,
  ): Promise<TaskWriteAccess> {
    return getWriteAccess(target, userId);
  }

  /** Throws TaskAccessError unless `userId` may mutate tasks of `target`'s team. */
  public static assertWriteAccess(
    target: Pick<Task, "id" | "teamId">,
    userId: string,
    forbiddenMessage: string,
  ): Promise<void> {
    return assertWriteAccess(target, userId, forbiddenMessage);
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
    const rows = await db.delete(task).where(eq(task.id, taskId)).returning();
    return rows.length > 0;
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

  public static async getTaskComments(
    taskId: string,
    userId?: string,
  ): Promise<TaskCommentWithSource[]> {
    const { TaskWorkspaceService } = await import("./task-workspace-service");
    return TaskWorkspaceService.getTaskComments(taskId, userId);
  }

  public static async createTaskComment(payload: {
    taskId: string;
    userId: string;
    content: string;
  }): Promise<TaskCommentWithSource> {
    const { TaskWorkspaceService } = await import("./task-workspace-service");
    return TaskWorkspaceService.createTaskComment(payload);
  }
}
