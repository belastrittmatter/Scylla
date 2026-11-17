import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account, project, user } from "@/db/schema";
import { POST } from "@/app/api/projects/route";
import { GithubSyncService } from "@/services/github/github-sync-service";
import { TeamService } from "@/services/team/team-service";
import { loadProjectForMember } from "@/lib/project-pages";
import {
  createGithubFixture,
  type GithubFixture,
} from "../test-utils/github-fixtures";
import {
  mockGithubApi,
  type GithubMockRoute,
} from "../test-utils/mock-github-api";

let fixture: GithubFixture;
let restore: (() => void) | null = null;
let savedToken: string | undefined;
const extraUsers: string[] = [];

beforeEach(async () => {
  savedToken = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
  GithubSyncService.resetBackgroundSyncState();
  fixture = await createGithubFixture({ repo: null });
});

afterEach(async () => {
  // let a background sync started by the request settle before cleanup
  await new Promise((r) => setTimeout(r, 50));
  restore?.();
  restore = null;
  if (savedToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = savedToken;
  GithubSyncService.resetBackgroundSyncState();
  for (const id of extraUsers.splice(0)) {
    await db.delete(user).where(eq(user.id, id));
  }
  await db.delete(project).where(eq(project.teamId, fixture.teamId));
  await fixture.cleanup();
});

const EMPTY_LISTS: GithubMockRoute[] = [
  { method: "GET", path: /\/repos\/[^/]+\/[^/]+\/issues$/, body: [] },
  { method: "GET", path: /\/repos\/[^/]+\/[^/]+\/pulls$/, body: [] },
];

const post = (body: unknown, userId: string | null = fixture.userId) =>
  POST(
    new Request("http://localhost/api/projects", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(userId ? { "x-user-id": userId } : {}),
      },
      body: JSON.stringify(body),
    }),
  );

async function addTeammate(role: "member" | "admin", github: boolean) {
  const id = crypto.randomUUID();
  await db
    .insert(user)
    .values({ id, name: "Mate", email: `mate-${id}@example.com` });
  extraUsers.push(id);
  if (github) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "mate-login",
      providerId: "github",
      userId: id,
      accessToken: "gho_mate",
      updatedAt: new Date(),
    });
  }
  await TeamService.addTeamMember({ teamId: fixture.teamId, userId: id, role });
  return id;
}

describe("POST /api/projects with GitHub fields", () => {
  test("links an existing repo and invites teammates with a GitHub account", async () => {
    await addTeammate("member", true);
    const mock = mockGithubApi([
      ...EMPTY_LISTS,
      {
        method: "PUT",
        path: /\/repos\/acme\/widgets\/collaborators\/mate-login$/,
        status: 201,
        body: {},
      },
    ]);
    restore = mock.restore;

    const res = await post({
      teamId: fixture.teamId,
      name: "Linked",
      githubRepo: "acme/widgets",
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.githubRepo).toBe("acme/widgets");
    const [row] = await db
      .select()
      .from(project)
      .where(eq(project.id, json.id));
    expect(row.githubRepo).toBe("acme/widgets");
    expect(
      mock.calls.some(
        (c) =>
          c.method === "PUT" &&
          c.path.startsWith("/repos/acme/widgets/collaborators/"),
      ),
    ).toBe(true);
  });

  test("400 for an invalid githubRepo", async () => {
    const res = await post({
      teamId: fixture.teamId,
      name: "Bad",
      githubRepo: "not valid",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain(
      "Repository must be in the form owner/repo",
    );
  });

  test("createNewRepo creates the repository and links it", async () => {
    const mock = mockGithubApi([
      ...EMPTY_LISTS,
      {
        method: "POST",
        path: "/user/repos",
        status: 201,
        body: {
          id: 7,
          full_name: "octo/new-repo",
          name: "new-repo",
          owner: { login: "octo" },
          private: true,
          html_url: "https://github.com/octo/new-repo",
          description: null,
        },
      },
    ]);
    restore = mock.restore;

    const res = await post({
      teamId: fixture.teamId,
      name: "Fresh",
      createNewRepo: { name: "new-repo" },
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.githubRepo).toBe("octo/new-repo");
    const [row] = await db
      .select()
      .from(project)
      .where(eq(project.id, json.id));
    expect(row.githubRepo).toBe("octo/new-repo");
    const create = mock.calls.find(
      (c) => c.method === "POST" && c.path === "/user/repos",
    );
    expect((create?.body as { private: boolean }).private).toBe(true);
  });

  test("createNewRepo with an invalid name gives 400 and no GitHub call", async () => {
    const mock = mockGithubApi([]);
    restore = mock.restore;
    const res = await post({
      teamId: fixture.teamId,
      name: "Bad",
      createNewRepo: { name: "bad name" },
    });
    expect(res.status).toBe(400);
    expect(mock.calls.length).toBe(0);
  });

  test("a GitHub 422 on creation gives 502 and no project", async () => {
    const mock = mockGithubApi([
      {
        method: "POST",
        path: "/user/repos",
        status: 422,
        body: { message: "name already exists" },
      },
    ]);
    restore = mock.restore;
    const res = await post({
      teamId: fixture.teamId,
      name: "Never",
      createNewRepo: { name: "taken" },
    });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("422");
    const rows = await db
      .select()
      .from(project)
      .where(eq(project.teamId, fixture.teamId));
    expect(rows.filter((r) => r.name === "Never")).toHaveLength(0);
  });

  test("both githubRepo and createNewRepo give 400", async () => {
    const mock = mockGithubApi([]);
    restore = mock.restore;
    const res = await post({
      teamId: fixture.teamId,
      name: "Both",
      githubRepo: "acme/widgets",
      createNewRepo: { name: "x" },
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Provide either githubRepo or createNewRepo, not both",
    });
    expect(mock.calls.length).toBe(0);
  });

  test("a non-admin member gets 403 and no GitHub call", async () => {
    const memberId = await addTeammate("member", false);
    const mock = mockGithubApi([]);
    restore = mock.restore;
    const res = await post(
      {
        teamId: fixture.teamId,
        name: "Nope",
        createNewRepo: { name: "nope" },
      },
      memberId,
    );
    expect(res.status).toBe(403);
    expect(mock.calls.length).toBe(0);
  });

  test("without GitHub fields the project is created as before", async () => {
    const mock = mockGithubApi([]);
    restore = mock.restore;
    const res = await post({ teamId: fixture.teamId, name: "Plain" });
    expect(res.status).toBe(201);
    expect((await res.json()).githubRepo).toBeNull();
    expect(mock.calls.length).toBe(0);
  });

  test("401 without a user and no GitHub call", async () => {
    const mock = mockGithubApi([]);
    restore = mock.restore;
    const res = await post(
      { teamId: fixture.teamId, name: "Anon", githubRepo: "acme/widgets" },
      null,
    );
    expect(res.status).toBe(401);
    expect(mock.calls.length).toBe(0);
  });

  test("404 for an unknown team and no GitHub call", async () => {
    const mock = mockGithubApi([]);
    restore = mock.restore;
    const res = await post({
      teamId: crypto.randomUUID(),
      name: "Ghost",
      createNewRepo: { name: "ghost" },
    });
    expect(res.status).toBe(404);
    expect(mock.calls.length).toBe(0);
  });

  test("a non-admin cannot link an existing repo either", async () => {
    const memberId = await addTeammate("member", false);
    const mock = mockGithubApi([...EMPTY_LISTS]);
    restore = mock.restore;
    const res = await post(
      { teamId: fixture.teamId, name: "Nope2", githubRepo: "acme/widgets" },
      memberId,
    );
    expect(res.status).toBe(403);
    expect(mock.calls.length).toBe(0);
    const rows = await db
      .select()
      .from(project)
      .where(eq(project.teamId, fixture.teamId));
    expect(rows.filter((r) => r.name === "Nope2")).toHaveLength(0);
  });

  test("createNewRepo sends isPrivate false and falls back to the project description", async () => {
    const mock = mockGithubApi([
      ...EMPTY_LISTS,
      {
        method: "POST",
        path: "/user/repos",
        status: 201,
        body: {
          id: 8,
          full_name: "octo/pub-repo",
          name: "pub-repo",
          owner: { login: "octo" },
          private: false,
          html_url: "https://github.com/octo/pub-repo",
          description: "Project text",
        },
      },
    ]);
    restore = mock.restore;
    const res = await post({
      teamId: fixture.teamId,
      name: "Pub",
      description: "Project text",
      createNewRepo: { name: "pub-repo", isPrivate: false },
    });
    expect(res.status).toBe(201);
    const create = mock.calls.find(
      (c) => c.method === "POST" && c.path === "/user/repos",
    );
    const sent = create?.body as { private: boolean; description?: string };
    expect(sent.private).toBe(false);
    expect(sent.description).toBe("Project text");
  });

  test("createNewRepo without a GitHub connection gives 400 and no project", async () => {
    const adminId = await addTeammate("admin", false);
    const mock = mockGithubApi([]);
    restore = mock.restore;
    const res = await post(
      {
        teamId: fixture.teamId,
        name: "Unconnected",
        createNewRepo: { name: "some-repo" },
      },
      adminId,
    );
    expect(res.status).toBe(400);
    expect(mock.calls.length).toBe(0);
    const rows = await db
      .select()
      .from(project)
      .where(eq(project.teamId, fixture.teamId));
    expect(rows.filter((r) => r.name === "Unconnected")).toHaveLength(0);
  });

  test("a failing collaborator invite does not fail project creation", async () => {
    await addTeammate("member", true);
    const mock = mockGithubApi([
      ...EMPTY_LISTS,
      {
        method: "PUT",
        path: /\/repos\/acme\/widgets\/collaborators\/mate-login$/,
        status: 403,
        body: { message: "forbidden" },
      },
    ]);
    restore = mock.restore;
    const res = await post({
      teamId: fixture.teamId,
      name: "InviteFails",
      githubRepo: "acme/widgets",
    });
    expect(res.status).toBe(201);
    expect((await res.json()).githubRepo).toBe("acme/widgets");
  });
});

describe("loadProjectForMember", () => {
  test("returns project, team and role for a team member", async () => {
    const found = await loadProjectForMember(fixture.projectId, fixture.userId);
    expect(found?.role).toBe("owner");
    expect(found?.project.id).toBe(fixture.projectId);
    expect(found?.project.teamId).toBe(fixture.teamId);
    expect(found?.project.githubRepo).toBeNull();
    expect(found?.team.id).toBe(fixture.teamId);
  });

  test("returns null for a user outside the team", async () => {
    const outsider = crypto.randomUUID();
    await db
      .insert(user)
      .values({ id: outsider, name: "Out", email: `out-${outsider}@x.com` });
    extraUsers.push(outsider);
    expect(await loadProjectForMember(fixture.projectId, outsider)).toBeNull();
  });

  test("returns null for a missing project", async () => {
    expect(
      await loadProjectForMember(crypto.randomUUID(), fixture.userId),
    ).toBeNull();
  });
});
