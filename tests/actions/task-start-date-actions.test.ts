import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { user } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";
import { TaskService } from "../../src/services/task/task-service";
import { mockSessionUser } from "../test-utils/mock-session";
import { createTaskAction, updateTaskAction } from "../../src/actions";

const START = "2026-11-10T09:00:00.000Z";
const DUE = "2026-11-12T18:00:00.000Z";
const AFTER_DUE = "2026-11-15T09:00:00.000Z";

describe("Server actions: task startDate (S2 / C6)", () => {
  const uid = Math.random().toString(36).substring(2, 8);
  const ownerId = `usr_start_date_actions_${uid}`;
  let teamId: string;
  let session: ReturnType<typeof mockSessionUser>;

  async function seedTask(
    title: string,
    startDate: Date | null,
    dueDate: Date | null,
  ) {
    return TaskService.createTask({
      teamId,
      title,
      creatorId: ownerId,
      status: "todo",
      priority: "medium",
      startDate,
      dueDate,
    });
  }

  beforeAll(async () => {
    await db.insert(user).values({
      id: ownerId,
      email: `start_date_actions_${uid}@example.com`,
      name: "Start Date Actions Owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const created = await TeamService.createTeam({
      name: `Start Date Actions Team ${uid}`,
      ownerId,
    });
    teamId = created.id;
    session = mockSessionUser(ownerId);
  });

  afterAll(async () => {
    session?.mockRestore();
    if (teamId) await TeamService.deleteTeam(teamId);
    await db.delete(user).where(eq(user.id, ownerId));
  });

  test("createTaskAction persists an ISO string startDate", async () => {
    const res = await createTaskAction({
      title: `Start ISO ${uid}`,
      teamId,
      startDate: START,
      dueDate: DUE,
    });
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.startDate).toBeInstanceOf(Date);
    expect(res.data!.startDate!.getTime()).toBe(new Date(START).getTime());
    expect(res.data!.dueDate!.getTime()).toBe(new Date(DUE).getTime());

    const stored = await TaskService.getTaskById(res.data!.id);
    expect(stored!.startDate!.getTime()).toBe(new Date(START).getTime());
  });

  test("createTaskAction accepts a Date startDate", async () => {
    const start = new Date(START);
    const res = await createTaskAction({
      title: `Start Date obj ${uid}`,
      teamId,
      startDate: start,
      dueDate: new Date(DUE),
    });
    expect(res.success).toBe(true);
    expect(res.data!.startDate!.getTime()).toBe(start.getTime());
  });

  test("createTaskAction without startDate stores null", async () => {
    const res = await createTaskAction({
      title: `No start ${uid}`,
      teamId,
      dueDate: DUE,
    });
    expect(res.success).toBe(true);
    expect(res.data!.startDate).toBeNull();
  });

  test("createTaskAction with startDate after dueDate returns success:false mentioning startDate", async () => {
    const title = `Out of order create ${uid}`;
    let res: Awaited<ReturnType<typeof createTaskAction>> | undefined;
    let thrown: unknown;
    try {
      res = await createTaskAction({
        title,
        teamId,
        startDate: AFTER_DUE,
        dueDate: DUE,
      });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeUndefined();
    expect(res!.success).toBe(false);
    expect(typeof res!.error).toBe("string");
    expect(res!.error).toContain("startDate");

    const tasks = await TaskService.listTasks({ teamId });
    expect(tasks.some((t) => t.title === title)).toBe(false);
  });

  test("createTaskAction with an invalid startDate returns success:false mentioning startDate", async () => {
    const title = `Invalid start create ${uid}`;
    const res = await createTaskAction({
      title,
      teamId,
      startDate: "not-a-date",
      dueDate: DUE,
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain("startDate");

    const tasks = await TaskService.listTasks({ teamId });
    expect(tasks.some((t) => t.title === title)).toBe(false);
  });

  test("updateTaskAction sets a valid startDate", async () => {
    const seeded = await seedTask(`Update set ${uid}`, null, new Date(DUE));
    const res = await updateTaskAction(seeded.id, { startDate: START });
    expect(res.success).toBe(true);
    expect(res.data!.startDate!.getTime()).toBe(new Date(START).getTime());

    const stored = await TaskService.getTaskById(seeded.id);
    expect(stored!.startDate!.getTime()).toBe(new Date(START).getTime());
  });

  test("updateTaskAction with startDate: null clears it", async () => {
    const seeded = await seedTask(
      `Update clear ${uid}`,
      new Date(START),
      new Date(DUE),
    );
    expect(seeded.startDate).not.toBeNull();

    const res = await updateTaskAction(seeded.id, { startDate: null });
    expect(res.success).toBe(true);
    expect(res.data!.startDate).toBeNull();

    const stored = await TaskService.getTaskById(seeded.id);
    expect(stored!.startDate).toBeNull();
  });

  test("updateTaskAction with startDate after stored dueDate returns success:false and changes nothing", async () => {
    const seeded = await seedTask(
      `Update out of order ${uid}`,
      new Date(START),
      new Date(DUE),
    );

    let res: Awaited<ReturnType<typeof updateTaskAction>> | undefined;
    let thrown: unknown;
    try {
      res = await updateTaskAction(seeded.id, {
        startDate: AFTER_DUE,
        title: "Should not be written",
      });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeUndefined();
    expect(res!.success).toBe(false);
    expect(typeof res!.error).toBe("string");
    expect(res!.error).toContain("startDate");

    const stored = await TaskService.getTaskById(seeded.id);
    expect(stored!.title).toBe(`Update out of order ${uid}`);
    expect(stored!.startDate!.getTime()).toBe(new Date(START).getTime());
    expect(stored!.dueDate!.getTime()).toBe(new Date(DUE).getTime());
  });

  test("updateTaskAction with an invalid startDate returns success:false mentioning startDate", async () => {
    const seeded = await seedTask(
      `Update invalid ${uid}`,
      new Date(START),
      new Date(DUE),
    );
    const res = await updateTaskAction(seeded.id, { startDate: "garbage" });
    expect(res.success).toBe(false);
    expect(res.error).toContain("startDate");

    const stored = await TaskService.getTaskById(seeded.id);
    expect(stored!.startDate!.getTime()).toBe(new Date(START).getTime());
  });

  test("updateTaskAction without startDate leaves it unchanged", async () => {
    const seeded = await seedTask(
      `Update untouched ${uid}`,
      new Date(START),
      new Date(DUE),
    );
    const res = await updateTaskAction(seeded.id, {
      title: `Update untouched renamed ${uid}`,
    });
    expect(res.success).toBe(true);
    expect(res.data!.title).toBe(`Update untouched renamed ${uid}`);
    expect(res.data!.startDate!.getTime()).toBe(new Date(START).getTime());

    const stored = await TaskService.getTaskById(seeded.id);
    expect(stored!.startDate!.getTime()).toBe(new Date(START).getTime());
  });
});
