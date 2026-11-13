import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { POST as createTaskHandler } from "../../src/app/api/tasks/route";
import { PATCH as updateTaskHandler } from "../../src/app/api/tasks/[id]/route";
import { db } from "../../src/db";
import { user } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";
import { TaskService } from "../../src/services/task/task-service";

const uid = Math.random().toString(36).slice(2, 8);
const START = "2026-11-10T09:00:00.000Z";
const DUE = "2026-11-12T18:00:00.000Z";

describe("Tasks REST API startDate (C4)", () => {
  let ownerId: string;
  let teamId: string;

  const post = (body: Record<string, unknown>) =>
    createTaskHandler(
      new Request("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": ownerId },
        body: JSON.stringify({
          teamId,
          creatorId: ownerId,
          title: `Start date API task ${uid}`,
          ...body,
        }),
      }),
    );

  const patch = (taskId: string, body: Record<string, unknown>) =>
    updateTaskHandler(
      new Request(`http://localhost:3000/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": ownerId },
        body: JSON.stringify(body),
      }),
      { params: { id: taskId } },
    );

  const createStored = (startDate: string | null, dueDate: string | null) =>
    TaskService.createTask({
      title: `Stored start date task ${uid}`,
      status: "todo",
      priority: "medium",
      teamId,
      creatorId: ownerId,
      startDate: startDate === null ? null : new Date(startDate),
      dueDate: dueDate === null ? null : new Date(dueDate),
    });

  beforeAll(async () => {
    process.env.BETTER_AUTH_URL ||= "http://localhost:3000";

    const [owner] = await db
      .insert(user)
      .values({
        id: `usr_start_api_${uid}`,
        name: "Start Date API Owner",
        email: `start-date-api-owner-${uid}@example.com`,
      })
      .returning();
    ownerId = owner.id;

    const team = await TeamService.createTeam({
      name: `Start Date API Team ${uid}`,
      ownerId,
    });
    teamId = team.id;
  });

  afterAll(async () => {
    if (teamId) await TeamService.deleteTeam(teamId);
    if (ownerId) await db.delete(user).where(eq(user.id, ownerId));
  });

  test("POST /api/tasks - accepts startDate and returns it in the JSON", async () => {
    const res = await post({ startDate: START, dueDate: DUE });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(typeof data.startDate).toBe("string");
    expect(new Date(data.startDate).getTime()).toBe(new Date(START).getTime());
    expect(new Date(data.dueDate).getTime()).toBe(new Date(DUE).getTime());

    const stored = await TaskService.getTaskById(data.id);
    expect(stored?.startDate?.getTime()).toBe(new Date(START).getTime());
  });

  test("POST /api/tasks - without startDate returns startDate null", async () => {
    const res = await post({ dueDate: DUE });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty("startDate");
    expect(data.startDate).toBeNull();
  });

  test("POST /api/tasks - startDate after dueDate returns 400", async () => {
    const before = (await TaskService.listTasks({ teamId })).length;
    const res = await post({
      startDate: "2026-11-13T09:00:00.000Z",
      dueDate: DUE,
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(typeof data.error).toBe("string");
    expect(data.error).toContain("startDate");
    expect((await TaskService.listTasks({ teamId })).length).toBe(before);
  });

  test("POST /api/tasks - invalid startDate string returns 400", async () => {
    const res = await post({ startDate: "invalid-date" });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("startDate");
  });

  test("PATCH /api/tasks/:id - sets startDate", async () => {
    const stored = await createStored(null, DUE);
    const res = await patch(stored.id, { startDate: START });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.startDate).toBe("string");
    expect(new Date(data.startDate).getTime()).toBe(new Date(START).getTime());

    const fetched = await TaskService.getTaskById(stored.id);
    expect(fetched?.startDate?.getTime()).toBe(new Date(START).getTime());
  });

  test("PATCH /api/tasks/:id - startDate null clears it", async () => {
    const stored = await createStored(START, DUE);
    expect(stored.startDate).toBeInstanceOf(Date);

    const res = await patch(stored.id, { startDate: null });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("startDate");
    expect(data.startDate).toBeNull();

    const fetched = await TaskService.getTaskById(stored.id);
    expect(fetched?.startDate).toBeNull();
  });

  test("PATCH /api/tasks/:id - startDate after stored dueDate returns 400 and changes nothing", async () => {
    const stored = await createStored(START, DUE);

    const res = await patch(stored.id, {
      startDate: "2026-11-13T09:00:00.000Z",
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(typeof data.error).toBe("string");
    expect(data.error).toContain("startDate");

    const fetched = await TaskService.getTaskById(stored.id);
    expect(fetched?.startDate?.getTime()).toBe(new Date(START).getTime());
    expect(fetched?.dueDate?.getTime()).toBe(new Date(DUE).getTime());
  });

  test("PATCH /api/tasks/:id - dueDate before stored startDate returns 400", async () => {
    const stored = await createStored(START, DUE);

    const res = await patch(stored.id, {
      dueDate: "2026-11-09T09:00:00.000Z",
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("startDate");

    const fetched = await TaskService.getTaskById(stored.id);
    expect(fetched?.startDate?.getTime()).toBe(new Date(START).getTime());
    expect(fetched?.dueDate?.getTime()).toBe(new Date(DUE).getTime());
  });

  test("PATCH /api/tasks/:id - invalid startDate string returns 400", async () => {
    const stored = await createStored(START, DUE);

    const res = await patch(stored.id, { startDate: "garbage" });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("startDate");

    const fetched = await TaskService.getTaskById(stored.id);
    expect(fetched?.startDate?.getTime()).toBe(new Date(START).getTime());
  });
});
