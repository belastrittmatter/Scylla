import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import {
  DELETE as deleteTaskHandler,
  PATCH as patchTaskHandler,
} from "@/app/api/tasks/[id]/route";
import { createCalendarMcpServer } from "@/app/api/mcp/route";
import { db, task as taskTable, user } from "@/db";
import { TaskService } from "@/services/task/task-service";
import { TeamService } from "@/services/team/team-service";

type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<{ content: Array<{ text: string }>; isError?: boolean }>;

const uid = Math.random().toString(36).slice(2, 7);
const ids = {
  owner: `usr_del_owner_${uid}`,
  admin: `usr_del_admin_${uid}`,
  creator: `usr_del_creator_${uid}`,
  member: `usr_del_member_${uid}`,
  viewer: `usr_del_viewer_${uid}`,
  stranger: `usr_del_stranger_${uid}`,
};

async function del(taskId: string, userId?: string) {
  const req = new Request(`http://localhost/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: userId ? { "x-user-id": userId } : {},
  });
  return deleteTaskHandler(req, { params: { id: taskId } });
}

async function patch(taskId: string, userId: string, body: unknown) {
  const req = new Request(`http://localhost/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "x-user-id": userId, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return patchTaskHandler(req, { params: { id: taskId } });
}

async function mcpDelete(userId: string, taskId: string) {
  const server = await createCalendarMcpServer({ sub: userId, scopes: ["*"] });
  const tools = (
    server as unknown as {
      _registeredTools: Record<string, { handler: ToolHandler }>;
    }
  )._registeredTools;
  return tools.delete_task.handler({ taskId });
}

describe("Task deletion authorization", () => {
  let teamId: string;
  // Task created by the plain "creator" member; recreated per test.
  const newTask = async (creatorId = ids.creator) =>
    TaskService.createTask({
      teamId,
      title: `Delete me ${uid}`,
      status: "todo",
      priority: "medium",
      creatorId,
    });

  beforeAll(async () => {
    await db.insert(user).values(
      Object.values(ids).map((id) => ({
        id,
        email: `${id}@example.com`,
        name: id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
    const team = await TeamService.createTeam({
      name: `Delete Perms ${uid}`,
      slug: `delete-perms-${uid}`,
      ownerId: ids.owner,
    });
    teamId = team.id;
    for (const [userId, role] of [
      [ids.admin, "admin"],
      [ids.creator, "member"],
      [ids.member, "member"],
      [ids.viewer, "viewer"],
    ] as const) {
      await TeamService.addTeamMember({ teamId, userId, role });
    }
  });

  afterAll(async () => {
    if (teamId) await TeamService.deleteTeam(teamId);
    await db.delete(user).where(inArray(user.id, Object.values(ids)));
  });

  test("unauthenticated caller gets 401", async () => {
    const task = await newTask();
    expect((await del(task.id)).status).toBe(401);
  });

  test("missing task gets 404", async () => {
    expect((await del(`missing-${uid}`, ids.owner)).status).toBe(404);
  });

  test("non-member gets 404 so task ids cannot be probed", async () => {
    const task = await newTask();
    const res = await del(task.id, ids.stranger);
    expect(res.status).toBe(404);
    expect(await TaskService.getTaskById(task.id)).not.toBeNull();
  });

  test("viewer gets 403, even on a task they created", async () => {
    // Viewers can't create tasks, so simulate one created before a demotion.
    const task = await newTask();
    await db
      .update(taskTable)
      .set({ creatorId: ids.viewer })
      .where(eq(taskTable.id, task.id));
    expect((await del(task.id, ids.viewer)).status).toBe(403);
  });

  test("member who did not create the task can delete it", async () => {
    const task = await newTask();
    expect((await del(task.id, ids.member)).status).toBe(200);
    expect(await TaskService.getTaskById(task.id)).toBeNull();
  });

  test("creator (member) can delete their own task", async () => {
    const task = await newTask();
    expect((await del(task.id, ids.creator)).status).toBe(200);
    expect(await TaskService.getTaskById(task.id)).toBeNull();
  });

  test("admin can delete any task", async () => {
    const task = await newTask();
    expect((await del(task.id, ids.admin)).status).toBe(200);
  });

  test("owner can delete a task with comments and time sessions", async () => {
    const task = await newTask();
    await TaskService.createTaskComment({
      taskId: task.id,
      userId: ids.creator,
      content: "note",
    });
    await TaskService.startTaskSession(task.id, ids.creator);
    expect((await del(task.id, ids.owner)).status).toBe(200);
    expect(await TaskService.getTaskTimeSessions(task.id)).toHaveLength(0);
  });

  test("invalid id gets 400", async () => {
    expect((await del("x".repeat(300), ids.owner)).status).toBe(400);
  });

  test("MCP delete_task enforces the same rule", async () => {
    const task = await newTask();
    const stranger = await mcpDelete(ids.stranger, task.id);
    expect(stranger.isError).toBe(true);
    expect(stranger.content[0].text).toContain("not found");
    const viewer = await mcpDelete(ids.viewer, task.id);
    expect(viewer.isError).toBe(true);
    expect(viewer.content[0].text).toContain("Permission denied");
    expect(viewer.content[0].text).toContain("not viewers");
    expect(await TaskService.getTaskById(task.id)).not.toBeNull();
    expect((await mcpDelete(ids.member, task.id)).isError).toBeFalsy();
    expect(await TaskService.getTaskById(task.id)).toBeNull();
  });

  test("PATCH: viewer gets 403, non-member gets 404, member gets 200", async () => {
    const task = await newTask();
    expect((await patch(task.id, ids.viewer, { title: "x" })).status).toBe(403);
    expect((await patch(task.id, ids.stranger, { title: "x" })).status).toBe(
      404,
    );
    expect(
      (await patch(`missing-${uid}`, ids.owner, { title: "x" })).status,
    ).toBe(404);
    const ok = await patch(task.id, ids.member, { title: "renamed" });
    expect(ok.status).toBe(200);
    expect((await TaskService.getTaskById(task.id))?.title).toBe("renamed");
  });

  test("service enforces write access on update and delete", async () => {
    const task = await newTask();
    await expect(
      TaskService.updateTask(task.id, { status: "done" }, ids.viewer),
    ).rejects.toThrow(/Viewer role cannot update tasks/);
    await expect(
      TaskService.updateTask(task.id, { title: "x" }, ids.stranger),
    ).rejects.toThrow(/not found/);
    await expect(TaskService.deleteTask(task.id, ids.viewer)).rejects.toThrow(
      /viewers/,
    );
    await expect(TaskService.deleteTask(task.id, ids.stranger)).rejects.toThrow(
      /not found/,
    );
    expect(await TaskService.getTaskById(task.id)).not.toBeNull();
    expect(await TaskService.deleteTask(task.id, ids.member)).toBe(true);
  });
});
