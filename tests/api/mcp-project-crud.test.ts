import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { createCalendarMcpServer } from "@/app/api/mcp/route";
import { db, user } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { TeamService } from "@/services/team/team-service";
import { ProjectService } from "@/services/project/project-service";
import { TaskService } from "@/services/task/task-service";

interface RegisteredToolDef {
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

function getTools(server: unknown): Record<string, RegisteredToolDef> {
  return (server as { _registeredTools: Record<string, RegisteredToolDef> })._registeredTools;
}

describe("MCP Project CRUD Tools Suite", () => {
  const ownerId = "usr_proj_crud_owner";
  const strangerId = "usr_proj_crud_stranger";

  beforeEach(async () => {
    for (const [id, email, name] of [
      [ownerId, "proj_owner@example.com", "Project Owner"],
      [strangerId, "proj_stranger@example.com", "Project Stranger"],
    ]) {
      const exists = await db.select().from(user).where(eq(user.id, id)).limit(1);
      if (exists.length === 0) {
        await db
          .insert(user)
          .values({ id, email, name, createdAt: new Date(), updatedAt: new Date() });
      }
    }
  });

  afterAll(async () => {
    await db.delete(user).where(inArray(user.id, [ownerId, strangerId]));
  });

  it("registers project CRUD tools", async () => {
    const server = await createCalendarMcpServer({ sub: ownerId });
    const tools = getTools(server);
    expect(tools["get_project"]).toBeDefined();
    expect(tools["update_project"]).toBeDefined();
    expect(tools["delete_project"]).toBeDefined();
  });

  it("manages project lifecycle with metrics and permission checks", async () => {
    const uid = Math.random().toString(36).substring(2, 7);
    const team = await TeamService.createTeam({
      name: `Mobile Apps Team ${uid}`,
      ownerId,
    });

    const project = await ProjectService.createProject({
      teamId: team.id,
      name: "iOS v2 Release",
      status: "active",
      color: "#3b82f6",
    });

    // Seed tasks for metrics check
    await TaskService.createTask({
      teamId: team.id,
      projectId: project.id,
      title: "Design login UI",
      status: "done",
      priority: "medium",
      creatorId: ownerId,
    });
    await TaskService.createTask({
      teamId: team.id,
      projectId: project.id,
      title: "Implement Biometric Auth",
      status: "in_progress",
      priority: "high",
      creatorId: ownerId,
    });

    const ownerServer = await createCalendarMcpServer({ sub: ownerId });
    const strangerServer = await createCalendarMcpServer({ sub: strangerId });
    const ownerTools = getTools(ownerServer);
    const strangerTools = getTools(strangerServer);

    // 1. get_project with metrics
    const getRes = await ownerTools["get_project"].handler({ projectId: project.id });
    expect(getRes.isError).toBeFalsy();
    const getData = JSON.parse(getRes.content[0].text);
    expect(getData.project.name).toBe("iOS v2 Release");
    expect(getData.metrics.totalTasks).toBe(2);
    expect(getData.metrics.doneTasks).toBe(1);
    expect(getData.metrics.inProgressTasks).toBe(1);

    // 2. get_project by stranger fails
    const strangerGet = await strangerTools["get_project"].handler({ projectId: project.id });
    expect(strangerGet.isError).toBe(true);

    // 3. update_project
    const updateRes = await ownerTools["update_project"].handler({
      projectId: project.id,
      name: "iOS v2.1 Release",
      status: "completed",
      color: "#10b981",
    });
    expect(updateRes.isError).toBeFalsy();
    const updatedData = JSON.parse(updateRes.content[0].text);
    expect(updatedData.project.name).toBe("iOS v2.1 Release");
    expect(updatedData.project.status).toBe("completed");

    // 4. update_project by stranger fails
    const strangerUpdate = await strangerTools["update_project"].handler({
      projectId: project.id,
      name: "Hacked Project",
    });
    expect(strangerUpdate.isError).toBe(true);

    // 5. delete_project by stranger fails
    const strangerDelete = await strangerTools["delete_project"].handler({ projectId: project.id });
    expect(strangerDelete.isError).toBe(true);

    // 6. delete_project by owner succeeds
    const deleteRes = await ownerTools["delete_project"].handler({ projectId: project.id });
    expect(deleteRes.isError).toBeFalsy();

    // 7. Verify deletion
    const verifyGet = await ownerTools["get_project"].handler({ projectId: project.id });
    expect(verifyGet.isError).toBe(true);
  });
});
