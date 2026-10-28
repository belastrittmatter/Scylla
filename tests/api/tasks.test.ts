import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { GET as getTasksHandler, POST as createTaskHandler } from "../../src/app/api/tasks/route";
import {
  GET as getTaskHandler,
  PATCH as updateTaskHandler,
  DELETE as deleteTaskHandler,
} from "../../src/app/api/tasks/[id]/route";
import { TeamService } from "../../src/services/team/team-service";
import { ProjectService } from "../../src/services/project/project-service";
import { seedDatabase } from "../../src/db/seed";

describe("Tasks REST API Endpoints", () => {
  let teamId: string;
  let projectId: string;
  let createdTaskId: string;
  const creatorUserId = "usr_alex_rivera";
  const assigneeUserId = "usr_test_user";

  beforeAll(async () => {
    process.env.BETTER_AUTH_URL ||= "http://localhost:3000";
    await seedDatabase();

    const team = await TeamService.createTeam({
      name: "Task API Team",
      slug: `task-api-team-${Date.now()}`,
      ownerId: creatorUserId,
    });
    teamId = team.id;

    const proj = await ProjectService.createProject({
      teamId,
      name: "API Subsystem",
      slug: `api-subsystem-${Date.now()}`,
    });
    projectId = proj.id;
  });

  afterAll(async () => {
    if (teamId) {
      await TeamService.deleteTeam(teamId);
    }
  });

  test("POST /api/tasks - creates task with relations", async () => {
    const req = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        projectId,
        title: "Build REST endpoints",
        description: "Expose HTTP API for tasks",
        priority: "high",
        status: "todo",
        creatorId: creatorUserId,
        assigneeId: assigneeUserId,
        dueDate: "2026-11-01T12:00:00.000Z",
      }),
    });

    const res = await createTaskHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.title).toBe("Build REST endpoints");
    expect(data.teamId).toBe(teamId);
    expect(data.projectId).toBe(projectId);
    expect(data.priority).toBe("high");
    createdTaskId = data.id;
  });

  test("POST /api/tasks - rejects invalid dueDate format with 400", async () => {
    const req = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        projectId,
        title: "Task with bad date",
        creatorId: creatorUserId,
        dueDate: "invalid-date",
      }),
    });

    const res = await createTaskHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid date format");
  });

  test("POST /api/tasks - returns 404 when teamId does not exist", async () => {
    const req = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: "non-existent-team-id",
        title: "Test Task",
        creatorId: creatorUserId,
      }),
    });

    const res = await createTaskHandler(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('Team with id "non-existent-team-id" not found');
  });

  test("POST /api/tasks - returns 404 when projectId does not belong to team", async () => {
    const req = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        projectId: "non-existent-project-id",
        title: "Test Task With Invalid Project",
        creatorId: creatorUserId,
      }),
    });

    const res = await createTaskHandler(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('Project with id "non-existent-project-id" not found');
  });

  test("GET /api/tasks?teamId=... - lists tasks with filters", async () => {
    const req = new Request(`http://localhost:3000/api/tasks?teamId=${teamId}&priority=high`);
    const res = await getTasksHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((t: { id: string }) => t.id === createdTaskId)).toBe(true);
  });

  test("GET /api/tasks/[id] - retrieves task with relations", async () => {
    const req = new Request("http://localhost:3000/api/tasks");
    const res = await getTaskHandler(req, { params: { id: createdTaskId } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(createdTaskId);
    expect(data.creator).toBeDefined();
    expect(data.assignee).toBeDefined();
    expect(data.project).toBeDefined();
  });

  test("PATCH /api/tasks/[id] - updates task status and priority", async () => {
    const req = new Request("http://localhost:3000/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress", priority: "urgent" }),
    });

    const res = await updateTaskHandler(req, { params: { id: createdTaskId } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("in_progress");
    expect(data.priority).toBe("urgent");
  });

  test("PATCH /api/tasks/[id] - rejects invalid dueDate format with 400", async () => {
    const req = new Request("http://localhost:3000/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: "invalid-date" }),
    });

    const res = await updateTaskHandler(req, { params: { id: createdTaskId } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid date format");
  });

  test("DELETE /api/tasks/[id] - deletes task", async () => {
    const req = new Request("http://localhost:3000/api/tasks", { method: "DELETE" });
    const res = await deleteTaskHandler(req, { params: { id: createdTaskId } });
    expect(res.status).toBe(200);

    const getRes = await getTaskHandler(req, { params: { id: createdTaskId } });
    expect(getRes.status).toBe(404);
  });
});
