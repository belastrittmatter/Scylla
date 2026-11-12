import { describe, it, expect, afterAll } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createCalendarMcpServer } from "@/app/api/mcp/route";
import { db, user } from "@/db";
import { eq } from "drizzle-orm";
import { TeamService } from "@/services/team/team-service";
import { ProjectService } from "@/services/project/project-service";
import { TaskService } from "@/services/task/task-service";

const ownerId = "usr_sub_task_client_owner";

async function call(
  client: Client,
  name: string,
  args: Record<string, unknown>,
) {
  const res = await client.callTool({ name, arguments: args });
  const text = (res.content as Array<{ text: string }>)[0].text;
  return { isError: res.isError, text };
}

describe("MCP client session: sub-tasks (issue #119)", () => {
  afterAll(async () => {
    await db.delete(user).where(eq(user.id, ownerId));
  });

  it("creates, reads and resolves a sub-task over the MCP protocol", async () => {
    const [existing] = await db
      .select()
      .from(user)
      .where(eq(user.id, ownerId))
      .limit(1);
    if (!existing) {
      await db.insert(user).values({
        id: ownerId,
        email: "sub_task_client@example.com",
        name: "Sub Task Client",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    const suffix = Math.random().toString(36).substring(2, 7);
    const team = await TeamService.createTeam({
      name: `SubTask Client ${suffix}`,
      ownerId,
    });
    const project = await ProjectService.createProject({
      teamId: team.id,
      name: "Sub Task Client Project",
      slug: `sub-client-${suffix}`,
    });
    const parent = await TaskService.createTask({
      teamId: team.id,
      title: "Parent",
      status: "todo",
      priority: "medium",
      creatorId: ownerId,
    });

    const server = await createCalendarMcpServer({
      sub: ownerId,
      scopes: ["*"],
    });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "qa-client", version: "1.0.0" });
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const { tools } = await client.listTools();
    const createTool = tools.find((t) => t.name === "create_task");
    expect(Object.keys(createTool!.inputSchema.properties ?? {})).toContain(
      "parentTaskId",
    );

    const created = await call(client, "create_task", {
      title: "Child",
      teamId: team.id,
      projectId: project.id,
      parentTaskId: parent.id,
    });
    expect(created.isError).toBeFalsy();
    const child = JSON.parse(created.text).task;
    expect(child.parentTaskId).toBe(parent.id);

    const before = JSON.parse(
      (await call(client, "get_task", { taskId: parent.id })).text,
    );
    expect(before.task.subTaskProgress).toEqual({ total: 1, resolved: 0 });
    expect(before.task.subTasks.map((t: { id: string }) => t.id)).toEqual([
      child.id,
    ]);

    expect(
      (await call(client, "update_task", { taskId: child.id, status: "done" }))
        .isError,
    ).toBeFalsy();
    const after = JSON.parse(
      (await call(client, "get_task", { taskId: parent.id })).text,
    );
    expect(after.task.subTaskProgress).toEqual({ total: 1, resolved: 1 });

    // a sub-task of a sub-task is rejected (one nesting level)
    const nested = await call(client, "create_task", {
      title: "Grandchild",
      teamId: team.id,
      projectId: project.id,
      parentTaskId: child.id,
    });
    expect(nested.isError).toBe(true);

    await client.close();
  });
});
