import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { user } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";
import {
  TaskService,
  TaskDateRangeError,
} from "../../src/services/task/task-service";

const DAY = 86_400_000;
const uid = Math.random().toString(36).slice(2, 8);

describe("TaskService startDate (C2, C3)", () => {
  let ownerId: string;
  let teamId: string;

  const newTask = (extra: Record<string, unknown> = {}) =>
    TaskService.createTask({
      title: `Start date task ${uid}`,
      status: "todo",
      priority: "medium",
      teamId,
      creatorId: ownerId,
      ...extra,
    } as Parameters<typeof TaskService.createTask>[0]);

  const taskCount = async () =>
    (await TaskService.listTasks({ teamId })).length;

  beforeAll(async () => {
    const [owner] = await db
      .insert(user)
      .values({
        id: `usr_start_date_${uid}`,
        name: "Start Date Owner",
        email: `start-date-owner-${uid}@example.com`,
      })
      .returning();
    ownerId = owner.id;

    const team = await TeamService.createTeam({
      name: `Start Date Team ${uid}`,
      ownerId,
    });
    teamId = team.id;
  });

  afterAll(async () => {
    if (teamId) await TeamService.deleteTeam(teamId);
    if (ownerId) await db.delete(user).where(eq(user.id, ownerId));
  });

  describe("C2: persistence of startDate", () => {
    test("createTask persists startDate given as a Date", async () => {
      const start = new Date("2026-11-10T09:00:00.000Z");
      const created = await newTask({ startDate: start });
      expect(created.startDate).toBeInstanceOf(Date);
      expect(created.startDate?.getTime()).toBe(start.getTime());

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.startDate).toBeInstanceOf(Date);
      expect(fetched?.startDate?.getTime()).toBe(start.getTime());
    });

    test("createTask persists startDate given as a date string", async () => {
      const created = await newTask({ startDate: "2026-11-10" });
      expect(created.startDate).toBeInstanceOf(Date);
      expect(created.startDate?.getTime()).toBe(
        new Date("2026-11-10").getTime(),
      );

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.startDate?.getTime()).toBe(
        new Date("2026-11-10").getTime(),
      );
    });

    test("createTask persists startDate given as an epoch number", async () => {
      const epoch = Date.UTC(2026, 10, 10, 9, 30, 0);
      const created = await newTask({ startDate: epoch });
      expect(created.startDate).toBeInstanceOf(Date);
      expect(created.startDate?.getTime()).toBe(epoch);

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.startDate?.getTime()).toBe(epoch);
    });

    test("createTask without startDate stores null", async () => {
      const created = await newTask();
      expect(created.startDate).toBeNull();

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.startDate).toBeNull();
    });

    test("createTask with startDate null stores null", async () => {
      const created = await newTask({ startDate: null });
      expect(created.startDate).toBeNull();

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.startDate).toBeNull();
    });

    test("updateTask with a startDate sets it", async () => {
      const created = await newTask();
      expect(created.startDate).toBeNull();

      const start = new Date("2026-12-01T08:00:00.000Z");
      const updated = await TaskService.updateTask(
        created.id,
        { startDate: start },
        ownerId,
      );
      expect(updated.startDate).toBeInstanceOf(Date);
      expect(updated.startDate?.getTime()).toBe(start.getTime());

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.startDate?.getTime()).toBe(start.getTime());
    });

    test("updateTask with startDate null clears it", async () => {
      const created = await newTask({
        startDate: new Date("2026-12-01T08:00:00.000Z"),
      });
      expect(created.startDate).toBeInstanceOf(Date);

      const updated = await TaskService.updateTask(
        created.id,
        { startDate: null },
        ownerId,
      );
      expect(updated.startDate).toBeNull();

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.startDate).toBeNull();
    });

    test("updateTask without startDate leaves it unchanged", async () => {
      const start = new Date("2026-12-01T08:00:00.000Z");
      const created = await newTask({ startDate: start });

      const updated = await TaskService.updateTask(
        created.id,
        { title: "x" },
        ownerId,
      );
      expect(updated.title).toBe("x");
      expect(updated.startDate).toBeInstanceOf(Date);
      expect(updated.startDate?.getTime()).toBe(start.getTime());

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.title).toBe("x");
      expect(fetched?.startDate?.getTime()).toBe(start.getTime());
    });
  });

  describe("C3: startDate <= dueDate ordering rule", () => {
    test("create with startDate equal to dueDate succeeds", async () => {
      const when = new Date("2026-11-12T18:00:00.000Z");
      const created = await newTask({ startDate: when, dueDate: when });
      expect(created.startDate?.getTime()).toBe(when.getTime());
      expect(created.dueDate?.getTime()).toBe(when.getTime());
    });

    test("create with startDate after dueDate rejects and inserts nothing", async () => {
      const due = new Date("2026-11-12T18:00:00.000Z");
      const before = await taskCount();

      let caught: unknown;
      try {
        await newTask({
          startDate: new Date(due.getTime() + DAY),
          dueDate: due,
        });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(Error);
      expect(caught).toBeInstanceOf(TaskDateRangeError);
      expect((caught as Error).message).toContain("startDate");
      expect(await taskCount()).toBe(before);
    });

    test("create with startDate set and dueDate null succeeds", async () => {
      const start = new Date("2030-01-01T00:00:00.000Z");
      const created = await newTask({ startDate: start, dueDate: null });
      expect(created.startDate?.getTime()).toBe(start.getTime());
      expect(created.dueDate).toBeNull();
    });

    test("create with dueDate set and startDate null succeeds", async () => {
      const due = new Date("2020-01-01T00:00:00.000Z");
      const created = await newTask({ startDate: null, dueDate: due });
      expect(created.startDate).toBeNull();
      expect(created.dueDate?.getTime()).toBe(due.getTime());
    });

    test("update startDate past the stored dueDate rejects and leaves startDate unchanged", async () => {
      const start = new Date("2026-11-10T09:00:00.000Z");
      const due = new Date("2026-11-12T18:00:00.000Z");
      const created = await newTask({ startDate: start, dueDate: due });

      let caught: unknown;
      try {
        await TaskService.updateTask(
          created.id,
          { startDate: new Date(due.getTime() + DAY) },
          ownerId,
        );
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(TaskDateRangeError);
      expect((caught as Error).message).toContain("startDate");

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.startDate?.getTime()).toBe(start.getTime());
      expect(fetched?.dueDate?.getTime()).toBe(due.getTime());
    });

    test("update dueDate before the stored startDate rejects and leaves dueDate unchanged", async () => {
      const start = new Date("2026-11-10T09:00:00.000Z");
      const due = new Date("2026-11-12T18:00:00.000Z");
      const created = await newTask({ startDate: start, dueDate: due });

      let caught: unknown;
      try {
        await TaskService.updateTask(
          created.id,
          { dueDate: new Date(start.getTime() - DAY) },
          ownerId,
        );
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(TaskDateRangeError);
      expect((caught as Error).message).toContain("startDate");

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.dueDate?.getTime()).toBe(due.getTime());
      expect(fetched?.startDate?.getTime()).toBe(start.getTime());
    });

    test("update with both dates provided and valid succeeds even when it moves both", async () => {
      const created = await newTask({
        startDate: new Date("2026-11-10T09:00:00.000Z"),
        dueDate: new Date("2026-11-12T18:00:00.000Z"),
      });

      // New start is after the old due; new due is after the new start.
      const newStart = new Date("2026-12-20T09:00:00.000Z");
      const newDue = new Date("2026-12-22T18:00:00.000Z");
      const updated = await TaskService.updateTask(
        created.id,
        { startDate: newStart, dueDate: newDue },
        ownerId,
      );
      expect(updated.startDate?.getTime()).toBe(newStart.getTime());
      expect(updated.dueDate?.getTime()).toBe(newDue.getTime());

      // Moving both earlier: new due is before the old start.
      const earlierStart = new Date("2026-10-01T09:00:00.000Z");
      const earlierDue = new Date("2026-10-02T18:00:00.000Z");
      const updatedAgain = await TaskService.updateTask(
        created.id,
        { startDate: earlierStart, dueDate: earlierDue },
        ownerId,
      );
      expect(updatedAgain.startDate?.getTime()).toBe(earlierStart.getTime());
      expect(updatedAgain.dueDate?.getTime()).toBe(earlierDue.getTime());
    });

    test("update with both provided but startDate after dueDate rejects", async () => {
      const start = new Date("2026-11-10T09:00:00.000Z");
      const due = new Date("2026-11-12T18:00:00.000Z");
      const created = await newTask({ startDate: start, dueDate: due });

      let caught: unknown;
      try {
        await TaskService.updateTask(
          created.id,
          {
            startDate: new Date("2026-11-11T09:00:00.000Z"),
            dueDate: new Date("2026-11-10T09:00:00.000Z"),
          },
          ownerId,
        );
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(TaskDateRangeError);
      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.startDate?.getTime()).toBe(start.getTime());
      expect(fetched?.dueDate?.getTime()).toBe(due.getTime());
    });

    test("clearing dueDate then setting a far-future startDate succeeds", async () => {
      const created = await newTask({
        startDate: new Date("2026-11-10T09:00:00.000Z"),
        dueDate: new Date("2026-11-12T18:00:00.000Z"),
      });

      const cleared = await TaskService.updateTask(
        created.id,
        { dueDate: null },
        ownerId,
      );
      expect(cleared.dueDate).toBeNull();

      const farFuture = new Date("2099-01-01T00:00:00.000Z");
      const updated = await TaskService.updateTask(
        created.id,
        { startDate: farFuture },
        ownerId,
      );
      expect(updated.startDate?.getTime()).toBe(farFuture.getTime());
      expect(updated.dueDate).toBeNull();
    });

    test("clearing startDate removes the constraint for a later dueDate update", async () => {
      const created = await newTask({
        startDate: new Date("2026-11-10T09:00:00.000Z"),
        dueDate: new Date("2026-11-12T18:00:00.000Z"),
      });

      const veryEarly = new Date("2020-01-01T00:00:00.000Z");
      const updated = await TaskService.updateTask(
        created.id,
        { startDate: null, dueDate: veryEarly },
        ownerId,
      );
      expect(updated.startDate).toBeNull();
      expect(updated.dueDate?.getTime()).toBe(veryEarly.getTime());
    });

    test("rejected update with status in_progress writes nothing", async () => {
      const start = new Date("2026-11-10T09:00:00.000Z");
      const due = new Date("2026-11-12T18:00:00.000Z");
      const created = await newTask({ startDate: start, dueDate: due });
      expect(created.status).toBe("todo");

      let caught: unknown;
      try {
        await TaskService.updateTask(
          created.id,
          {
            status: "in_progress",
            startDate: new Date(due.getTime() + DAY),
          },
          ownerId,
        );
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(TaskDateRangeError);
      expect((caught as Error).message).toContain("startDate");

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.status).toBe("todo");
      expect(fetched?.startDate?.getTime()).toBe(start.getTime());

      const sessions = await TaskService.getTaskTimeSessions(created.id);
      expect(sessions.length).toBe(0);
    });

    test("invalid startDate string rejects on create", async () => {
      const before = await taskCount();
      await expect(newTask({ startDate: "not-a-date" })).rejects.toThrow();
      expect(await taskCount()).toBe(before);
    });

    test("invalid startDate string rejects on update", async () => {
      const start = new Date("2026-11-10T09:00:00.000Z");
      const created = await newTask({ startDate: start });

      await expect(
        TaskService.updateTask(
          created.id,
          {
            startDate: "not-a-date",
          } as unknown as Parameters<typeof TaskService.updateTask>[1],
          ownerId,
        ),
      ).rejects.toThrow();

      const fetched = await TaskService.getTaskById(created.id);
      expect(fetched?.startDate?.getTime()).toBe(start.getTime());
    });
  });
});
