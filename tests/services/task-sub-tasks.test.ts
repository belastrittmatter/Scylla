import { describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "../../src/db";
import { user } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";
import { TaskService } from "../../src/services/task/task-service";

async function setup() {
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "Sub Task Worker",
      email: `sub-task-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  const team = await TeamService.createTeam({
    name: `Sub Team ${crypto.randomUUID()}`,
    ownerId: u.id,
  });
  return { u, team };
}

describe("sub-tasks", () => {
  test("creates sub-tasks, reports progress, and rejects nesting/cross-team parents", async () => {
    const { u, team } = await setup();
    const other = await setup();
    try {
      const parent = await TaskService.createTask({
        title: "Parent",
        teamId: team.id,
        creatorId: u.id,
        status: "todo",
        priority: "medium",
      });
      const a = await TaskService.createTask({
        title: "Child A",
        teamId: team.id,
        creatorId: u.id,
        status: "todo",
        priority: "medium",
        parentTaskId: parent.id,
      });
      await TaskService.createTask({
        title: "Child B",
        teamId: team.id,
        creatorId: u.id,
        status: "todo",
        priority: "medium",
        parentTaskId: parent.id,
      });
      expect(a.parentTaskId).toBe(parent.id);

      await TaskService.updateTask(a.id, { status: "done" }, u.id);
      const fetched = await TaskService.getTaskById(parent.id);
      expect(fetched?.subTasks?.map((s) => s.title).sort()).toEqual([
        "Child A",
        "Child B",
      ]);
      expect(fetched?.subTaskProgress).toEqual({ total: 2, resolved: 1 });

      await expect(
        TaskService.createTask({
          title: "Grandchild",
          teamId: team.id,
          creatorId: u.id,
          status: "todo",
          priority: "medium",
          parentTaskId: a.id,
        }),
      ).rejects.toThrow("sub-task");
      await expect(
        TaskService.createTask({
          title: "Cross team",
          teamId: other.team.id,
          creatorId: other.u.id,
          status: "todo",
          priority: "medium",
          parentTaskId: parent.id,
        }),
      ).rejects.toThrow("not found");

      await TaskService.deleteTask(parent.id, u.id);
      const orphan = await TaskService.getTaskById(a.id);
      expect(orphan?.parentTaskId).toBeNull();
    } finally {
      await db.delete(user).where(inArray(user.id, [u.id, other.u.id]));
    }
  });
});
