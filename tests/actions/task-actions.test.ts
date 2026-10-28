import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { seedDefaultWorkspace } from "../../src/services/task-seed";
import { TeamService } from "../../src/services/team/team-service";
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
    await seedDefaultWorkspace();
    const ws = await getWorkspaceDataAction();
    const ownerId = ws.data!.teams[0].ownerId;
    const tempTeam = await TeamService.createTeam({
      name: `Action Test Team ${Date.now()}`,
      slug: `action-test-team-${Date.now()}`,
      ownerId,
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
    const statusRes = await updateTaskStatusAction(createdTask.id, "in_progress");
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
    expect(listRes.data!.some((c) => c.content === "Automated test comment content")).toBe(true);
  });
});
