import { db } from "@/db";
import { task, team, teamMember, project, type Task } from "@/db/schema";
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
import { canMutateTasks } from "./task-permissions";

/** `not_member` must be reported like a missing task so ids can't be probed. */
export type TaskWriteAccess = "allowed" | "forbidden" | "not_member";

/** Thrown by task mutations; `not_member` reads as "not found" so ids can't be probed. */
export class TaskAccessError extends Error {
  constructor(
    readonly access: Exclude<TaskWriteAccess, "allowed">,
    message: string,
  ) {
    super(message);
    this.name = "TaskAccessError";
  }
}

/** Thrown when a task's startDate is later than its dueDate. */
export class TaskDateRangeError extends Error {
  constructor() {
    super("startDate must be on or before dueDate");
    this.name = "TaskDateRangeError";
  }
}

/** Both dates set → start must not be after due; a null/absent date imposes no constraint. */
function assertDateOrder(
  start: Date | null | undefined,
  due: Date | null | undefined,
): void {
  if (start && due && start.getTime() > due.getTime()) {
    throw new TaskDateRangeError();
  }
}

export { MIN_TASK_SESSION_DURATION_SECONDS };

export class TaskService {
  public static async createTask(input: CreateTaskInput): Promise<Task> {
    const validated = CreateTaskSchema.parse(input);
    assertDateOrder(validated.startDate, validated.dueDate);

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

    if (validated.creatorId) {
      const access = await TaskService.getWriteAccess(
        validated,
        validated.creatorId,
      );
      if (access === "forbidden") {
        throw new Error("Forbidden: Viewer role cannot create tasks");
      }
      if (access === "not_member") {
        throw new Error("Forbidden: Creator is not a member of this team");
      }
    }

    if (validated.projectId) {
      if (!projectRecord || projectRecord.teamId !== validated.teamId) {
        throw new Error(
          `Project with id "${validated.projectId}" not found in team "${validated.teamId}"`,
        );
      }
    }

    if (validated.assigneeId) {
      const isMember = await TeamService.isTeamMember(
        validated.teamId,
        validated.assigneeId,
      );
      if (!isMember) {
        throw new Error(
          `User "${validated.assigneeId}" is not a member of team "${validated.teamId}"`,
        );
      }
    }

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

    const effectiveStart =
      validated.startDate !== undefined
        ? validated.startDate
        : existing.startDate;
    const effectiveDue =
      validated.dueDate !== undefined ? validated.dueDate : existing.dueDate;
    assertDateOrder(effectiveStart, effectiveDue);

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
    if (validated.startDate !== undefined)
      updateData.startDate = validated.startDate;
    if (validated.position !== undefined)
      updateData.position = validated.position;
    if (validated.estimatedMinutes !== undefined)
      updateData.estimatedMinutes = validated.estimatedMinutes;

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

  /** Single write-permission check for create/update/delete (see task-permissions). */
  public static async getWriteAccess(
    target: Pick<Task, "teamId">,
    userId: string,
  ): Promise<TaskWriteAccess> {
    const [teamRecord, membership] = await Promise.all([
      db.query.team.findFirst({
        where: eq(team.id, target.teamId),
        columns: { ownerId: true },
      }),
      db.query.teamMember.findFirst({
        where: and(
          eq(teamMember.teamId, target.teamId),
          eq(teamMember.userId, userId),
        ),
        columns: { role: true },
      }),
    ]);
    const isTeamOwner = teamRecord?.ownerId === userId;
    if (!isTeamOwner && !membership) return "not_member";
    const allowed = canMutateTasks({
      role: membership?.role,
      isTeamOwner,
    });
    return allowed ? "allowed" : "forbidden";
  }

  /** Throws TaskAccessError unless `userId` may mutate tasks of `target`'s team. */
  public static async assertWriteAccess(
    target: Pick<Task, "id" | "teamId">,
    userId: string,
    forbiddenMessage: string,
  ): Promise<void> {
    const access = await TaskService.getWriteAccess(target, userId);
    if (access === "not_member") {
      throw new TaskAccessError(
        access,
        `Task with id "${target.id}" not found`,
      );
    }
    if (access === "forbidden") {
      throw new TaskAccessError(access, forbiddenMessage);
    }
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

  public static async getTaskComments(taskId: string) {
    const { TaskWorkspaceService } = await import("./task-workspace-service");
    return TaskWorkspaceService.getTaskComments(taskId);
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
