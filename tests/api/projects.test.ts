import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import {
  GET as getProjectsHandler,
  POST as createProjectHandler,
} from "../../src/app/api/projects/route";
import {
  GET as getProjectHandler,
  PATCH as updateProjectHandler,
  DELETE as deleteProjectHandler,
} from "../../src/app/api/projects/[id]/route";
import { TeamService } from "../../src/services/team/team-service";
import { seedDatabase } from "../../src/db/seed";

describe("Projects REST API Endpoints", () => {
  let teamId: string;
  let createdProjectId: string;
  const projectSlug = `api-proj-${Date.now()}`;

  beforeAll(async () => {
    process.env.BETTER_AUTH_URL ||= "http://localhost:3000";
    await seedDatabase();

    const team = await TeamService.createTeam({
      name: "Project Test Team",
      slug: `proj-test-team-${Date.now()}`,
      ownerId: "usr_alex_rivera",
    });
    teamId = team.id;
  });

  afterAll(async () => {
    if (teamId) {
      await TeamService.deleteTeam(teamId);
    }
  });

  test("POST /api/projects - creates a project", async () => {
    const req = new Request("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        name: "Core Infrastructure",
        slug: projectSlug,
        description: "DevOps & Core Services",
      }),
    });

    const res = await createProjectHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe("Core Infrastructure");
    expect(data.teamId).toBe(teamId);
    createdProjectId = data.id;
  });

  test("POST /api/projects - returns 409 conflict when duplicate slug is used", async () => {
    const req = new Request("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        name: "Duplicate Project",
        slug: projectSlug,
      }),
    });

    const res = await createProjectHandler(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("already exists");
  });

  test("POST /api/projects - returns 404 when teamId does not exist", async () => {
    const req = new Request("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: "non-existent-team-id",
        name: "Test Project",
        slug: `proj-${Date.now()}`,
      }),
    });

    const res = await createProjectHandler(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain(
      'Team with id "non-existent-team-id" not found',
    );
  });

  test("GET /api/projects?teamId=...&status=invalid - returns 400 for invalid status parameter", async () => {
    const req = new Request(
      `http://localhost:3000/api/projects?teamId=${teamId}&status=not_a_valid_status`,
    );
    const res = await getProjectsHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid status parameter");
  });

  test("GET /api/projects?teamId=... - lists projects by team", async () => {
    const req = new Request(
      `http://localhost:3000/api/projects?teamId=${teamId}`,
    );
    const res = await getProjectsHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((p: { id: string }) => p.id === createdProjectId)).toBe(
      true,
    );
  });

  test("GET /api/projects (no teamId) - returns 401 when unauthenticated", async () => {
    const req = new Request("http://localhost:3000/api/projects");
    const res = await getProjectsHandler(req);
    expect(res.status).toBe(401);
  });

  test("GET /api/projects?teamId=...&slug=... - retrieves project by slug", async () => {
    const req = new Request(
      `http://localhost:3000/api/projects?teamId=${teamId}&slug=${projectSlug}`,
    );
    const res = await getProjectsHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(createdProjectId);
  });

  test("GET /api/projects/[id] - retrieves project by id", async () => {
    const req = new Request("http://localhost:3000/api/projects");
    const res = await getProjectHandler(req, {
      params: { id: createdProjectId },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(createdProjectId);
  });

  test("PATCH /api/projects/[id] - updates project attributes", async () => {
    const req = new Request("http://localhost:3000/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated Infrastructure",
        description: "Updated desc",
      }),
    });

    const res = await updateProjectHandler(req, {
      params: { id: createdProjectId },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Updated Infrastructure");
    expect(data.description).toBe("Updated desc");
  });

  test("DELETE /api/projects/[id] - deletes project", async () => {
    const req = new Request("http://localhost:3000/api/projects", {
      method: "DELETE",
    });
    const res = await deleteProjectHandler(req, {
      params: { id: createdProjectId },
    });
    expect(res.status).toBe(200);

    const getRes = await getProjectHandler(req, {
      params: { id: createdProjectId },
    });
    expect(getRes.status).toBe(404);
  });
});
