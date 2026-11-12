import { db } from "@/db";
import { task, type Task } from "@/db/schema";
import { eq, and, lte, lt, inArray, desc, asc, type SQL } from "drizzle-orm";
import type {
  TaskFilterInput,
  TaskWithRelations,
  TaskStatus,
} from "./task-types";

export class TaskQueryService {
  public static async getTaskById(
    taskId: string,
  ): Promise<TaskWithRelations | null> {
    const record = await db.query.task.findFirst({
      where: eq(task.id, taskId),
      with: {
        creator: {
          columns: { id: true, name: true, email: true, image: true },
        },
        assignee: {
          columns: { id: true, name: true, email: true, image: true },
        },
        project: { columns: { id: true, name: true, slug: true, color: true } },
        subTasks: { orderBy: [asc(task.position), asc(task.createdAt)] },
      },
    });
    if (!record) return null;
    const subTasks = record.subTasks;
    return {
      ...record,
      subTaskProgress: {
        total: subTasks.length,
        resolved: subTasks.filter(
          (s) => s.status === "done" || s.status === "cancelled",
        ).length,
      },
    } as TaskWithRelations;
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

    if (filter.assigneeId)
      conditions.push(eq(task.assigneeId, filter.assigneeId));

    if (filter.dueBefore) conditions.push(lte(task.dueDate, filter.dueBefore));

    if (filter.overdue) {
      const now = new Date();
      conditions.push(lt(task.dueDate, now));
      conditions.push(
        inArray(task.status, ["todo", "in_progress", "in_review"]),
      );
    }

    return await db
      .select()
      .from(task)
      .where(and(...conditions))
      .orderBy(asc(task.position), desc(task.createdAt));
  }

  public static async reorderTaskPositions(
    updates: Array<{ id: string; position: number; status?: TaskStatus }>,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await Promise.all(
        updates.map((item) => {
          const updateSet: Partial<typeof task.$inferInsert> = {
            position: item.position,
          };
          if (item.status) updateSet.status = item.status;
          return tx.update(task).set(updateSet).where(eq(task.id, item.id));
        }),
      );
    });
  }
}
