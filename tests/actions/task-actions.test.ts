import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { user } from "../../src/db/schema";
import { seedDefaultWorkspace } from "../../src/services/task-seed";
import { TeamService } from "../../src/services/team/team-service";
import { TaskService } from "../../src/services/task/task-service";
import { resolveActionUserId } from "../../src/actions/auth-helper";
import {
  getWorkspaceDataAction,
  createTaskAction,
  updateTaskStatusAction,
  updateTaskAction,
  createProjectAction,
  getTaskCommentsAction,
  createTaskCommentAction,
} from "../../src/actions";

describe("Task Server Actions with Core Domain Services", () => {
  let testTeamId: string;
  let testProjectId: string;
  let testTaskId: string;

  beforeAll(async () => {
    const actingUserId = await resolveActionUserId();
    await seedDefaultWorkspace(actingUserId);
    const tempTeam = await TeamService.createTeam({
      name: `Action Test Team ${Date.now()}`,
      slug: `action-test-team-${Date.now()}`,
      ownerId: actingUserId,
    });
    testTeamId = tempTeam.id;
  });

  afterAll(async () => {
    if (testTeamId) {
      await TeamService.deleteTeam(testTeamId);
    }
  });

  test("getWorkspaceDataAction returns initial seeded workspace data", async () => {
    const res = await getWorkspaceDataAction();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.teams.length).toBeGreaterThan(0);
    expect(res.data!.projects.length).toBeGreaterThan(0);
    expect(res.data!.tasks.length).toBeGreaterThan(0);
  });

  test("createProjectAction creates project via ProjectService", async () => {
    const res = await createProjectAction({
      teamId: testTeamId,
      name: `Action Project ${Date.now()}`,
      description: "Test project via action",
      color: "#6366f1",
    });

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.teamId).toBe(testTeamId);
    expect(res.data!.status).toBe("active");
    testProjectId = res.data!.id;
  });

  test("createTaskAction, updateTaskStatusAction, updateTaskAction lifecycle via TaskService", async () => {
    // 1. Create task
    const createRes = await createTaskAction({
      title: `Task Lifecycle ${Date.now()}`,
      description: "Action test description",
      status: "todo",
      priority: "urgent",
      teamId: testTeamId,
      projectId: testProjectId,
    });
    expect(createRes.success).toBe(true);
    const createdTask = createRes.data!;
    expect(createdTask.title).toContain("Task Lifecycle");
    expect(createdTask.status).toBe("todo");
    testTaskId = createdTask.id;

    // 2. Update status
    const statusRes = await updateTaskStatusAction(
      createdTask.id,
      "in_progress",
    );
    expect(statusRes.success).toBe(true);
    expect(statusRes.data!.status).toBe("in_progress");

    // 3. Update details
    const updateRes = await updateTaskAction(createdTask.id, {
      title: "Updated Task Title",
      priority: "high",
    });
    expect(updateRes.success).toBe(true);
    expect(updateRes.data!.title).toBe("Updated Task Title");
    expect(updateRes.data!.priority).toBe("high");
  });

  test("createTaskCommentAction and getTaskCommentsAction comments flow", async () => {
    const commentRes = await createTaskCommentAction({
      taskId: testTaskId,
      content: "Automated test comment content",
    });
    expect(commentRes.success).toBe(true);
    expect(commentRes.data!.content).toBe("Automated test comment content");

    const listRes = await getTaskCommentsAction(testTaskId);
    expect(listRes.success).toBe(true);
    expect(
      listRes.data!.some((c) => c.content === "Automated test comment content"),
    ).toBe(true);
  });

  describe("Security: Workspace and Team Authorization Guards (#93)", () => {
    let foreignTeamId: string;
    let foreignTaskId: string;
    let foreignUserId: string;

    beforeAll(async () => {
      const [foreignUser] = await db
        .insert(user)
        .values({
          id: `usr_foreign_${Date.now()}`,
          name: "Foreign User",
          email: `foreign-${Date.now()}@example.com`,
        })
        .returning();
      foreignUserId = foreignUser.id;

      const fTeam = await TeamService.createTeam({
        name: `Foreign Team ${Date.now()}`,
        slug: `foreign-team-${Date.now()}`,
        ownerId: foreignUserId,
      });
      foreignTeamId = fTeam.id;

      const fTask = await TaskService.createTask({
        title: "Foreign Secret Task",
        teamId: foreignTeamId,
        creatorId: foreignUserId,
        status: "todo",
        priority: "medium",
      });
      foreignTaskId = fTask.id;
    });

    afterAll(async () => {
      if (foreignTeamId) {
        await TeamService.deleteTeam(foreignTeamId);
      }
      if (foreignUserId) {
        await db.delete(user).where(eq(user.id, foreignUserId));
      }
    });

    test("createProjectAction rejects non-members", async () => {
      const res = await createProjectAction({
        teamId: foreignTeamId,
        name: "Unauthorized Project",
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Access denied|Unauthorized/i);
    });

    test("createTaskAction rejects non-members", async () => {
      const res = await createTaskAction({
        teamId: foreignTeamId,
        title: "Unauthorized Task",
        status: "todo",
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Access denied|Unauthorized/i);
    });

    test("updateTaskAction rejects non-members", async () => {
      const res = await updateTaskAction(foreignTaskId, {
        title: "Hacked Task Title",
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Access denied|Unauthorized/i);
    });

    test("updateTaskStatusAction rejects non-members", async () => {
      const res = await updateTaskStatusAction(foreignTaskId, "done");
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Access denied|Unauthorized/i);
    });

    test("getTaskCommentsAction rejects non-members", async () => {
      const res = await getTaskCommentsAction(foreignTaskId);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Access denied|Unauthorized/i);
    });

    test("createTaskCommentAction rejects non-members", async () => {
      const res = await createTaskCommentAction({
        taskId: foreignTaskId,
        content: "Unauthorized comment",
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Access denied|Unauthorized/i);
    });
  });
});
