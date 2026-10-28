import { db } from "@/db";
import { task, team, project, taskTimeSession, type Task, type TaskTimeSession } from "@/db/schema";
import { eq, and, lte, lt, inArray, desc, asc, isNull, type SQL } from "drizzle-orm";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskFilterInput,
  type TaskWithRelations,
  type TaskStatus,
} from "./task-types";

export const MIN_TASK_SESSION_DURATION_SECONDS = 60; // 1 minute (< 1 minute is considered accidental drag)

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
            .where(and(eq(task.teamId, validated.teamId), eq(task.status, validated.status)))
            .orderBy(desc(task.position))
            .limit(1)
        : Promise.resolve([]),
    ]);

    if (!teamRecord) {
      throw new Error(`Team with id "${validated.teamId}" not found`);
    }

    if (validated.projectId) {
      if (!projectRecord || projectRecord.teamId !== validated.teamId) {
        throw new Error(
          `Project with id "${validated.projectId}" not found in team "${validated.teamId}"`
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
        position,
        estimatedMinutes: validated.estimatedMinutes ?? 60,
      })
      .returning();

    if (validated.status === "in_progress") {
      await TaskService.startTaskSession(newTask.id, validated.creatorId);
    }

    return newTask;
  }

  public static async getTaskById(taskId: string): Promise<TaskWithRelations | null> {
    const record = await db.query.task.findFirst({
      where: eq(task.id, taskId),
      with: {
        creator: { columns: { id: true, name: true, email: true, image: true } },
        assignee: { columns: { id: true, name: true, email: true, image: true } },
        project: { columns: { id: true, name: true, slug: true, color: true } },
      },
    });
    return (record as TaskWithRelations) ?? null;
  }

  public static async listTasks(filter: TaskFilterInput): Promise<Task[]> {
    const conditions: SQL[] = [];

    if (Array.isArray(filter.teamId)) {
      if (filter.teamId.length === 0) return [];
      conditions.push(inArray(task.teamId, filter.teamId));
    } else if (filter.teamId) {
      conditions.push(eq(task.teamId, filter.teamId));
    }

    if (filter.projectId) conditions.push(eq(task.projectId, filter.projectId));

    if (filter.status) {
      if (Array.isArray(filter.status)) {
        conditions.push(inArray(task.status, filter.status));
      } else {
        conditions.push(eq(task.status, filter.status));
      }
    }

    if (filter.priority) {
      if (Array.isArray(filter.priority)) {
        conditions.push(inArray(task.priority, filter.priority));
      } else {
        conditions.push(eq(task.priority, filter.priority));
      }
    }

    if (filter.assigneeId) conditions.push(eq(task.assigneeId, filter.assigneeId));

    if (filter.dueBefore) conditions.push(lte(task.dueDate, filter.dueBefore));

    if (filter.overdue) {
      const now = new Date();
      conditions.push(lt(task.dueDate, now));
      conditions.push(inArray(task.status, ["todo", "in_progress", "in_review"]));
    }

    return await db
      .select()
      .from(task)
      .where(and(...conditions))
      .orderBy(asc(task.position), desc(task.createdAt));
  }

  public static async updateTask(
    taskId: string,
    input: UpdateTaskInput,
    currentUserId?: string
  ): Promise<Task> {
    const validated = UpdateTaskSchema.parse(input);

    const existing = await db.query.task.findFirst({
      where: eq(task.id, taskId),
    });
    if (!existing) throw new Error(`Task with id "${taskId}" not found`);

    if (validated.status !== undefined && validated.status !== existing.status) {
      if (validated.status === "in_progress") {
        const effectiveUserId =
          currentUserId || validated.assigneeId || existing.assigneeId || existing.creatorId;
        await TaskService.startTaskSession(taskId, effectiveUserId);
      } else if (existing.status === "in_progress") {
        await TaskService.stopTaskSession(taskId, MIN_TASK_SESSION_DURATION_SECONDS);
      }
    }

    const updateData: Partial<typeof task.$inferInsert> = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.priority !== undefined) updateData.priority = validated.priority;
    if (validated.projectId !== undefined) updateData.projectId = validated.projectId;
    if (validated.assigneeId !== undefined) updateData.assigneeId = validated.assigneeId;
    if (validated.dueDate !== undefined) updateData.dueDate = validated.dueDate;
    if (validated.position !== undefined) updateData.position = validated.position;
    if (validated.estimatedMinutes !== undefined)
      updateData.estimatedMinutes = validated.estimatedMinutes;

    const [updated] = await db.update(task).set(updateData).where(eq(task.id, taskId)).returning();
    return updated;
  }

  public static async startTaskSession(
    taskId: string,
    userId?: string | null
  ): Promise<TaskTimeSession> {
    const existingActive = await db.query.taskTimeSession.findFirst({
      where: and(eq(taskTimeSession.taskId, taskId), isNull(taskTimeSession.endedAt)),
    });
    if (existingActive) {
      return existingActive;
    }
    const inserted = await db
      .insert(taskTimeSession)
      .values({
        taskId,
        userId: userId ?? null,
        startedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();
    if (inserted.length > 0) {
      return inserted[0];
    }
    const concurrentActive = await db.query.taskTimeSession.findFirst({
      where: and(eq(taskTimeSession.taskId, taskId), isNull(taskTimeSession.endedAt)),
    });
    return concurrentActive!;
  }

  public static async stopTaskSession(
    taskId: string,
    minDurationSeconds = MIN_TASK_SESSION_DURATION_SECONDS
  ): Promise<TaskTimeSession | null> {
    const activeSession = await db.query.taskTimeSession.findFirst({
      where: and(eq(taskTimeSession.taskId, taskId), isNull(taskTimeSession.endedAt)),
    });
    if (!activeSession) return null;

    const now = new Date();
    const durationSeconds = Math.max(
      0,
      Math.round((now.getTime() - activeSession.startedAt.getTime()) / 1000)
    );

    // Anti-spam filter: discard session if shorter than minDurationSeconds (e.g. rapid drag-and-drop)
    if (durationSeconds < minDurationSeconds) {
      await db.delete(taskTimeSession).where(eq(taskTimeSession.id, activeSession.id));
      return null;
    }

    const [updated] = await db
      .update(taskTimeSession)
      .set({
        endedAt: now,
        durationSeconds,
      })
      .where(eq(taskTimeSession.id, activeSession.id))
      .returning();

    return updated;
  }

  public static async getTaskTimeSessions(taskId: string): Promise<TaskTimeSession[]> {
    return await db
      .select()
      .from(taskTimeSession)
      .where(eq(taskTimeSession.taskId, taskId))
      .orderBy(desc(taskTimeSession.startedAt));
  }

  public static async deleteTask(taskId: string): Promise<boolean> {
    const deleted = await db.delete(task).where(eq(task.id, taskId)).returning();
    return deleted.length > 0;
  }

  public static async reorderTaskPositions(
    updates: Array<{ id: string; position: number; status?: TaskStatus }>
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await Promise.all(
        updates.map((item) => {
          const updateSet: Partial<typeof task.$inferInsert> = { position: item.position };
          if (item.status) updateSet.status = item.status;
          return tx.update(task).set(updateSet).where(eq(task.id, item.id));
        })
      );
    });
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
