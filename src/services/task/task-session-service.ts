import { db } from "@/db";
import { taskTimeSession, type TaskTimeSession } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

export const MIN_TASK_SESSION_DURATION_SECONDS = 60;

export class TaskSessionService {
  public static async startTaskSession(
    taskId: string,
    userId?: string | null,
  ): Promise<TaskTimeSession> {
    const existingActive = await db.query.taskTimeSession.findFirst({
      where: and(
        eq(taskTimeSession.taskId, taskId),
        isNull(taskTimeSession.endedAt),
      ),
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
      where: and(
        eq(taskTimeSession.taskId, taskId),
        isNull(taskTimeSession.endedAt),
      ),
    });
    return concurrentActive!;
  }

  public static async stopTaskSession(
    taskId: string,
    minDurationSeconds = MIN_TASK_SESSION_DURATION_SECONDS,
  ): Promise<TaskTimeSession | null> {
    const activeSession = await db.query.taskTimeSession.findFirst({
      where: and(
        eq(taskTimeSession.taskId, taskId),
        isNull(taskTimeSession.endedAt),
      ),
    });
    if (!activeSession) return null;

    const now = new Date();
    const durationSeconds = Math.max(
      0,
      Math.round((now.getTime() - activeSession.startedAt.getTime()) / 1000),
    );

    if (durationSeconds < minDurationSeconds) {
      await db
        .delete(taskTimeSession)
        .where(eq(taskTimeSession.id, activeSession.id));
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

  public static async getTaskTimeSessions(
    taskId: string,
  ): Promise<TaskTimeSession[]> {
    return await db
      .select()
      .from(taskTimeSession)
      .where(eq(taskTimeSession.taskId, taskId))
      .orderBy(desc(taskTimeSession.startedAt));
  }
}
