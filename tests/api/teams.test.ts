import { describe, expect, test, beforeAll } from "bun:test";
import { GET as listTeamsHandler, POST as createTeamHandler } from "../../src/app/api/teams/route";
import {
  GET as getTeamHandler,
  PATCH as updateTeamHandler,
  DELETE as deleteTeamHandler,
} from "../../src/app/api/teams/[id]/route";
import {
  GET as listMembersHandler,
  POST as addMemberHandler,
} from "../../src/app/api/teams/[id]/members/route";
import {
  DELETE as removeMemberHandler,
  PATCH as updateMemberRoleHandler,
} from "../../src/app/api/teams/[id]/members/[userId]/route";
import { seedDatabase } from "../../src/db/seed";

describe("Teams REST API Endpoints", () => {
  let createdTeamId: string;
  const teamSlug = `api-test-team-${Date.now()}`;
  const ownerUserId = "usr_alex_rivera";
  const memberUserId = "usr_test_user";

  beforeAll(async () => {
    process.env.BETTER_AUTH_URL ||= "http://localhost:3000";
    await seedDatabase();
  });

  test("POST /api/teams - creates team and owner membership", async () => {
    const req = new Request("http://localhost:3000/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "API Test Team",
        slug: teamSlug,
        ownerId: ownerUserId,
      }),
    });

    const res = await createTeamHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe("API Test Team");
    createdTeamId = data.id;
  });

  test("POST /api/teams - returns 409 conflict when duplicate slug is used", async () => {
    const req = new Request("http://localhost:3000/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate Team",
        slug: teamSlug,
        ownerId: ownerUserId,
      }),
    });

    const res = await createTeamHandler(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("already exists");
  });

  test("GET /api/teams - lists teams for user", async () => {
    const req = new Request(`http://localhost:3000/api/teams?userId=${ownerUserId}`);
    const res = await listTeamsHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((t: { id: string }) => t.id === createdTeamId)).toBe(true);
  });

  test("GET /api/teams/[id] - retrieves team by id or slug", async () => {
    const req = new Request("http://localhost:3000/api/teams");
    const resById = await getTeamHandler(req, { params: { id: createdTeamId } });
    expect(resById.status).toBe(200);
    const teamById = await resById.json();
    expect(teamById.id).toBe(createdTeamId);

    const resBySlug = await getTeamHandler(req, { params: { id: teamSlug } });
    expect(resBySlug.status).toBe(200);
    const teamBySlug = await resBySlug.json();
    expect(teamBySlug.id).toBe(createdTeamId);
  });

  test("PATCH /api/teams/[id] - updates team details", async () => {
    const req = new Request("http://localhost:3000/api/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Renamed Team" }),
    });

    const res = await updateTeamHandler(req, { params: { id: createdTeamId } });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.name).toBe("Renamed Team");
  });

  test("POST & GET /api/teams/[id]/members - adds and lists members", async () => {
    const addReq = new Request("http://localhost:3000/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberUserId, role: "admin" }),
    });

    const addRes = await addMemberHandler(addReq, { params: { id: createdTeamId } });
    expect(addRes.status).toBe(201);

    const listReq = new Request("http://localhost:3000/api/teams");
    const listRes = await listMembersHandler(listReq, { params: { id: createdTeamId } });
    expect(listRes.status).toBe(200);
    const members = await listRes.json();
    expect(members.length).toBe(2);
  });

  test("PATCH /api/teams/[id]/members/[userId] - updates member role", async () => {
    const req = new Request("http://localhost:3000/api/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "viewer" }),
    });
    const res = await updateMemberRoleHandler(req, {
      params: { id: createdTeamId, userId: memberUserId },
    });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.role).toBe("viewer");
  });

  test("DELETE /api/teams/[id]/members/[userId] - removes member", async () => {
    const req = new Request("http://localhost:3000/api/teams", { method: "DELETE" });
    const res = await removeMemberHandler(req, {
      params: { id: createdTeamId, userId: memberUserId },
    });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/teams/[id] - deletes team", async () => {
    const req = new Request("http://localhost:3000/api/teams", { method: "DELETE" });
    const res = await deleteTeamHandler(req, { params: { id: createdTeamId } });
    expect(res.status).toBe(200);

    const getRes = await getTeamHandler(req, { params: { id: createdTeamId } });
    expect(getRes.status).toBe(404);
  });
});
