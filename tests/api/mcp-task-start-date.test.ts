import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createCalendarMcpServer } from "@/app/api/mcp/route";
import { db, user } from "@/db";
import { eq } from "drizzle-orm";
import { TeamService } from "@/services/team/team-service";
import { ProjectService } from "@/services/project/project-service";
import { TaskService } from "@/services/task/task-service";
import { createTaskSchema, updateTaskSchema } from "@/mcp/schemas";

interface ToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
  structuredContent?: unknown;
}

interface RegisteredToolDef {
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
}

function getTools(server: unknown): Record<string, RegisteredToolDef> {
  return (server as { _registeredTools: Record<string, RegisteredToolDef> })
    ._registeredTools;
}

const START = "2026-11-10T09:00:00.000Z";
const DUE = "2026-11-12T18:00:00.000Z";
const AFTER_DUE = "2026-11-15T09:00:00.000Z";

describe("MCP task tools: startDate (S2 / C5)", () => {
  const uid = Math.random().toString(36).substring(2, 8);
  const ownerId = `usr_mcp_start_date_${uid}`;
  let teamId: string;
  let projectId: string;
  let tools: Record<string, RegisteredToolDef>;

  async function seedTask(title: string, startDate: Date | null) {
    return TaskService.createTask({
      teamId,
      projectId,
      title,
      creatorId: ownerId,
      status: "todo",
      priority: "medium",
      startDate,
      dueDate: new Date(DUE),
    });
  }

  async function teamTaskTitles(): Promise<string[]> {
    const tasks = await TaskService.listTasks({ teamId });
    return tasks.map((t) => t.title);
  }

  beforeAll(async () => {
    await db.insert(user).values({
      id: ownerId,
      email: `mcp_start_date_${uid}@example.com`,
      name: "MCP Start Date Owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const team = await TeamService.createTeam({
      name: `MCP Start Date Team ${uid}`,
      ownerId,
    });
    teamId = team.id;
    const project = await ProjectService.createProject({
      teamId,
      name: `MCP Start Date Project ${uid}`,
    });
    projectId = project.id;

    const server = await createCalendarMcpServer({
      sub: ownerId,
      scopes: ["*"],
    });
    tools = getTools(server);
  });

  afterAll(async () => {
    if (teamId) await TeamService.deleteTeam(teamId);
    await db.delete(user).where(eq(user.id, ownerId));
  });

  it("create_task and update_task schemas expose an optional startDate described as 'ISO timestamp or YYYY-MM-DD'", () => {
    expect(tools["create_task"]).toBeDefined();
    expect(tools["update_task"]).toBeDefined();

    for (const schema of [createTaskSchema, updateTaskSchema]) {
      const field = (
        schema.shape as Record<
          string,
          {
            description?: string;
            isOptional: () => boolean;
            safeParse: (v: unknown) => { success: boolean };
          }
        >
      ).startDate;
      expect(field).toBeDefined();
      expect(field.isOptional()).toBe(true);
      expect(field.description ?? "").toContain("ISO timestamp or YYYY-MM-DD");
      expect(field.safeParse("2026-11-10").success).toBe(true);
      expect(field.safeParse(undefined).success).toBe(true);
    }

    // Omitting startDate still validates.
    expect(createTaskSchema.safeParse({ teamId, title: "x" }).success).toBe(
      true,
    );
    expect(updateTaskSchema.safeParse({ taskId: "t" }).success).toBe(true);
  });

  it("create_task with a valid startDate returns task.startDate", async () => {
    const title = `MCP create with start ${uid}`;
    const res = await tools["create_task"].handler({
      teamId,
      projectId,
      title,
      startDate: "2026-11-10",
      dueDate: "2026-11-12",
    });
    expect(res.isError).toBeFalsy();
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.task).toBeDefined();
    expect(typeof parsed.task.startDate).toBe("string");
    expect(new Date(parsed.task.startDate).getTime()).toBe(
      new Date("2026-11-10").getTime(),
    );

    const stored = await TaskService.getTaskById(parsed.task.id);
    expect(stored!.startDate!.getTime()).toBe(new Date("2026-11-10").getTime());
  });

  it("create_task with an empty startDate creates a task with no start date", async () => {
    const res = await tools["create_task"].handler({
      teamId,
      projectId,
      title: `MCP create empty start ${uid}`,
      startDate: "",
      dueDate: "2026-11-12",
    });
    expect(res.isError).toBeFalsy();
    const parsed = JSON.parse(res.content[0].text);
    expect("startDate" in parsed.task).toBe(true);
    expect(parsed.task.startDate).toBeNull();
  });

  it("create_task with an unparseable startDate returns isError mentioning startDate and creates nothing", async () => {
    const title = `MCP create bad start ${uid}`;
    const res = await tools["create_task"].handler({
      teamId,
      projectId,
      title,
      startDate: "not-a-date",
      dueDate: "2026-11-12",
    });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("startDate");
    expect(await teamTaskTitles()).not.toContain(title);
  });

  it("create_task with startDate after dueDate returns isError mentioning startDate and creates nothing", async () => {
    const title = `MCP create out of order ${uid}`;
    const res = await tools["create_task"].handler({
      teamId,
      projectId,
      title,
      startDate: AFTER_DUE,
      dueDate: DUE,
    });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("startDate");
    expect(await teamTaskTitles()).not.toContain(title);
  });

  it("create_task keeps throwing for non-date errors", async () => {
    await expect(
      tools["create_task"].handler({
        teamId,
        projectId: "proj_does_not_exist_start_date",
        title: `MCP create bad project ${uid}`,
        startDate: START,
        dueDate: DUE,
      }),
    ).rejects.toThrow("not found in team");
  });

  it("update_task with startDate after the stored dueDate returns isError and leaves the task unchanged", async () => {
    const title = `MCP update out of order ${uid}`;
    const seeded = await seedTask(title, new Date(START));
    const res = await tools["update_task"].handler({
      taskId: seeded.id,
      startDate: AFTER_DUE,
      title: "Should not be written",
    });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("startDate");

    const stored = await TaskService.getTaskById(seeded.id);
    expect(stored!.title).toBe(title);
    expect(stored!.startDate!.getTime()).toBe(new Date(START).getTime());
    expect(stored!.dueDate!.getTime()).toBe(new Date(DUE).getTime());
  });

  it("update_task with an unparseable startDate returns isError and leaves the task unchanged", async () => {
    const title = `MCP update garbage ${uid}`;
    const seeded = await seedTask(title, new Date(START));
    const res = await tools["update_task"].handler({
      taskId: seeded.id,
      startDate: "garbage",
      title: "Should not be written either",
    });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("startDate");

    const stored = await TaskService.getTaskById(seeded.id);
    expect(stored!.title).toBe(title);
    expect(stored!.startDate!.getTime()).toBe(new Date(START).getTime());
  });

  it("update_task with a valid startDate returns and persists task.startDate", async () => {
    const seeded = await seedTask(`MCP update valid ${uid}`, null);
    const res = await tools["update_task"].handler({
      taskId: seeded.id,
      startDate: START,
    });
    expect(res.isError).toBeFalsy();
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.task.startDate).toBe(START);

    const stored = await TaskService.getTaskById(seeded.id);
    expect(stored!.startDate!.getTime()).toBe(new Date(START).getTime());
  });

  it("update_task with an empty startDate clears it, and omitting it leaves it unchanged", async () => {
    const seeded = await seedTask(`MCP update clear ${uid}`, new Date(START));

    const untouched = await tools["update_task"].handler({
      taskId: seeded.id,
      title: `MCP update clear renamed ${uid}`,
    });
    expect(untouched.isError).toBeFalsy();
    const untouchedParsed = JSON.parse(untouched.content[0].text);
    expect(untouchedParsed.task.startDate).toBe(START);
    const afterUntouched = await TaskService.getTaskById(seeded.id);
    expect(afterUntouched!.startDate!.getTime()).toBe(
      new Date(START).getTime(),
    );

    const cleared = await tools["update_task"].handler({
      taskId: seeded.id,
      startDate: "",
    });
    expect(cleared.isError).toBeFalsy();
    const clearedParsed = JSON.parse(cleared.content[0].text);
    expect("startDate" in clearedParsed.task).toBe(true);
    expect(clearedParsed.task.startDate).toBeNull();
    const afterCleared = await TaskService.getTaskById(seeded.id);
    expect(afterCleared!.startDate).toBeNull();
  });

  it("list_tasks output includes startDate for each task", async () => {
    const seeded = await seedTask(`MCP list ${uid}`, new Date(START));
    const res = await tools["list_tasks"].handler({ teamId });
    expect(res.isError).toBeFalsy();
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.tasks.length).toBeGreaterThan(0);
    for (const t of parsed.tasks as Array<Record<string, unknown>>) {
      expect("startDate" in t).toBe(true);
    }
    const found = (
      parsed.tasks as Array<{ id: string; startDate: string | null }>
    ).find((t) => t.id === seeded.id);
    expect(found).toBeDefined();
    expect(found!.startDate).toBe(START);
  });

  it("get_task_board structuredContent.tasks entries include startDate", async () => {
    const seeded = await seedTask(`MCP board ${uid}`, new Date(START));
    const res = await tools["get_task_board"].handler({ teamId });
    expect(res.isError).toBeFalsy();
    const structured = res.structuredContent as {
      tasks: Array<{ id: string; startDate?: unknown }>;
    };
    expect(structured.tasks.length).toBeGreaterThan(0);
    for (const t of structured.tasks) {
      expect("startDate" in t).toBe(true);
    }
    const found = structured.tasks.find((t) => t.id === seeded.id);
    expect(found).toBeDefined();
    expect(new Date(found!.startDate as string | Date).getTime()).toBe(
      new Date(START).getTime(),
    );
  });

  it("get_active_tasks output includes startDate", async () => {
    const seeded = await seedTask(`MCP active ${uid}`, new Date(START));
    // Moving to in_progress opens an active time session.
    const moved = await tools["update_task"].handler({
      taskId: seeded.id,
      status: "in_progress",
    });
    expect(moved.isError).toBeFalsy();

    const res = await tools["get_active_tasks"].handler({ teamId });
    expect(res.isError).toBeFalsy();
    const parsed = JSON.parse(res.content[0].text);
    const found = (
      parsed.activeTasks as Array<{ id: string; startDate?: string | null }>
    ).find((t) => t.id === seeded.id);
    expect(found).toBeDefined();
    expect("startDate" in found!).toBe(true);
    expect(found!.startDate).toBe(START);
  });
});
