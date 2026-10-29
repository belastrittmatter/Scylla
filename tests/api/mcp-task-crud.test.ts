import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { createCalendarMcpServer } from "@/app/api/mcp/route";
import { db, user } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { TeamService } from "@/services/team/team-service";
import { TaskService } from "@/services/task/task-service";

interface RegisteredToolDef {
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

function getTools(server: unknown): Record<string, RegisteredToolDef> {
  return (server as { _registeredTools: Record<string, RegisteredToolDef> })
    ._registeredTools;
}

describe("MCP Task CRUD & Comments Suite", () => {
  const ownerId = "usr_task_crud_owner";
  const strangerId = "usr_task_crud_stranger";

  beforeEach(async () => {
    for (const [id, email, name] of [
      [ownerId, "task_owner@example.com", "Task Owner"],
      [strangerId, "task_stranger@example.com", "Task Stranger"],
    ]) {
      const exists = await db
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1);
      if (exists.length === 0) {
        await db
          .insert(user)
          .values({
            id,
            email,
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }
    }
  });

  afterAll(async () => {
    await db.delete(user).where(inArray(user.id, [ownerId, strangerId]));
  });

  it("registers all task CRUD and comments tools", async () => {
    const server = await createCalendarMcpServer({ sub: ownerId });
    const tools = getTools(server);
    expect(tools["get_task"]).toBeDefined();
    expect(tools["delete_task"]).toBeDefined();
    expect(tools["add_task_comment"]).toBeDefined();
    expect(tools["list_task_comments"]).toBeDefined();
  });

  it("manages task inspection, comments discussion, and deletion with auth checks", async () => {
    const uid = Math.random().toString(36).substring(2, 7);
    const team = await TeamService.createTeam({
      name: `Product Design Team ${uid}`,
      ownerId,
    });

    const task = await TaskService.createTask({
      teamId: team.id,
      title: "Design System Dark Mode Tokens",
      description: "Define semantic CSS variables for dark theme",
      status: "in_progress",
      priority: "high",
      creatorId: ownerId,
    });

    const ownerServer = await createCalendarMcpServer({ sub: ownerId });
    const strangerServer = await createCalendarMcpServer({ sub: strangerId });
    const ownerTools = getTools(ownerServer);
    const strangerTools = getTools(strangerServer);

    // 1. get_task by owner
    const getRes = await ownerTools["get_task"].handler({ taskId: task.id });
    expect(getRes.isError).toBeFalsy();
    const getData = JSON.parse(getRes.content[0].text);
    expect(getData.task.title).toBe("Design System Dark Mode Tokens");
    expect(getData.task.comments).toBeArray();

    // 2. get_task by stranger fails
    const strangerGet = await strangerTools["get_task"].handler({
      taskId: task.id,
    });
    expect(strangerGet.isError).toBe(true);

    // 3. add_task_comment by stranger fails
    const strangerComment = await strangerTools["add_task_comment"].handler({
      taskId: task.id,
      content: "Spam message",
    });
    expect(strangerComment.isError).toBe(true);

    // 4. add_task_comment by owner
    const commentRes = await ownerTools["add_task_comment"].handler({
      taskId: task.id,
      content: "Token hierarchy drafted in Figma component library.",
    });
    expect(commentRes.isError).toBeFalsy();
    const commentData = JSON.parse(commentRes.content[0].text);
    expect(commentData.comment.content).toContain("Token hierarchy");

    // 5. list_task_comments by owner
    const listCommentsRes = await ownerTools["list_task_comments"].handler({
      taskId: task.id,
    });
    expect(listCommentsRes.isError).toBeFalsy();
    const listCommentsData = JSON.parse(listCommentsRes.content[0].text);
    expect(listCommentsData.count).toBe(1);
    expect(listCommentsData.comments[0].content).toContain("Figma");

    // 6. delete_task by stranger fails
    const strangerDelete = await strangerTools["delete_task"].handler({
      taskId: task.id,
    });
    expect(strangerDelete.isError).toBe(true);

    // 7. delete_task by owner succeeds
    const deleteRes = await ownerTools["delete_task"].handler({
      taskId: task.id,
    });
    expect(deleteRes.isError).toBeFalsy();

    // 8. Verify deleted task can no longer be retrieved
    const verifyGet = await ownerTools["get_task"].handler({ taskId: task.id });
    expect(verifyGet.isError).toBe(true);
  });
});
