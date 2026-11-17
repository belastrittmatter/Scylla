import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { proxy } from "../../src/proxy";
import { account, db, project, user } from "../../src/db";
import { GET as listRepos } from "../../src/app/api/github/repos/route";
import { POST as createProject } from "../../src/app/api/projects/route";
import { POST as syncProject } from "../../src/app/api/projects/[id]/github-sync/route";
import { TeamService } from "../../src/services/team/team-service";
import { ProjectService } from "../../src/services/project/project-service";
import { GithubSyncService } from "../../src/services/github/github-sync-service";

interface Call {
  url: string;
  method: string;
  body: unknown;
}

const originalFetch = globalThis.fetch;
let calls: Call[] = [];
let respond: (call: Call) => Response = () =>
  new Response("{}", { status: 500 });
const userIds: string[] = [];
const teamIds: string[] = [];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function ghRepo(fullName: string, isPrivate = true) {
  return {
    id: 7,
    name: fullName.split("/")[1],
    full_name: fullName,
    description: null,
    private: isPrivate,
    html_url: `https://github.com/${fullName}`,
    updated_at: "2026-01-01T00:00:00Z",
    default_branch: "main",
  };
}

async function makeUser(connected: boolean): Promise<string> {
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "N",
      email: `n-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  userIds.push(u.id);
  if (connected) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "12345",
      providerId: "github",
      userId: u.id,
      accessToken: "gho_test",
    });
  }
  return u.id;
}

async function makeTeam(ownerId: string): Promise<string> {
  const team = await TeamService.createTeam({
    name: `T ${Date.now()}-${Math.random()}`,
    ownerId,
  });
  teamIds.push(team.id);
  return team.id;
}

function post(url: string, userId: string | null, body?: unknown): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (userId) headers["x-user-id"] = userId;
  return new Request(`http://localhost:3000${url}`, {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function projectBody(teamId: string, extra: Record<string, unknown> = {}) {
  const slug = `p-${crypto.randomUUID().slice(0, 8)}`;
  return { teamId, name: "Proj", slug, ...extra };
}

async function projectCount(teamId: string): Promise<number> {
  return (await db.select().from(project).where(eq(project.teamId, teamId)))
    .length;
}

const ISSUE = {
  number: 1,
  title: "Bug",
  body: "b",
  state: "open",
  html_url: "https://github.com/octo/repo/issues/1",
  labels: [],
};

beforeEach(() => {
  process.env.BETTER_AUTH_URL ||= "http://localhost:3000";
  calls = [];
  respond = () => new Response("{}", { status: 500 });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: Call = {
      url: String(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    return respond(call);
  }) as typeof fetch;
});

afterEach(async () => {
  await GithubSyncService.waitForBackgroundSyncs();
  globalThis.fetch = originalFetch;
});

afterAll(async () => {
  for (const id of teamIds) await TeamService.deleteTeam(id).catch(() => {});
  if (userIds.length) await db.delete(user).where(inArray(user.id, userIds));
});

describe("GET /api/github/repos", () => {
  it("answers 401 without a user", async () => {
    const res = await listRepos(
      new Request("http://localhost:3000/api/github/repos"),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("answers unconnected users with an empty list", async () => {
    const id = await makeUser(false);
    const res = await listRepos(
      new Request("http://localhost:3000/api/github/repos", {
        headers: { "x-user-id": id },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ connected: false, repositories: [] });
  });

  it("lists repositories for a connected user", async () => {
    const id = await makeUser(true);
    respond = () => json([ghRepo("octo/repo")]);
    const res = await listRepos(
      new Request("http://localhost:3000/api/github/repos", {
        headers: { "x-user-id": id },
      }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      connected: boolean;
      repositories: { fullName: string }[];
    };
    expect(data.connected).toBe(true);
    expect(data.repositories.map((r) => r.fullName)).toEqual(["octo/repo"]);
  });

  it("answers 502 when GitHub fails", async () => {
    const id = await makeUser(true);
    const res = await listRepos(
      new Request("http://localhost:3000/api/github/repos", {
        headers: { "x-user-id": id },
      }),
    );
    expect(res.status).toBe(502);
    expect(typeof ((await res.json()) as { error: string }).error).toBe(
      "string",
    );
  });
});

describe("POST /api/projects with GitHub options", () => {
  it("creates a plain project without any GitHub request", async () => {
    const id = await makeUser(true);
    const teamId = await makeTeam(id);
    const res = await createProject(
      post("/api/projects", id, projectBody(teamId)),
    );
    expect(res.status).toBe(201);
    expect(
      ((await res.json()) as { githubRepo: string | null }).githubRepo,
    ).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("links an existing repository by its canonical name and syncs", async () => {
    const id = await makeUser(true);
    const teamId = await makeTeam(id);
    respond = (c) => {
      if (c.url === "https://api.github.com/repos/octo/repo") {
        return json(ghRepo("octo/Repo"));
      }
      if (c.url.includes("/issues") || c.url.includes("/pulls"))
        return json([]);
      return new Response("{}", { status: 500 });
    };
    const res = await createProject(
      post(
        "/api/projects",
        id,
        projectBody(teamId, { githubRepo: "octo/repo" }),
      ),
    );
    expect(res.status).toBe(201);
    expect(((await res.json()) as { githubRepo: string }).githubRepo).toBe(
      "octo/Repo",
    );
    await GithubSyncService.waitForBackgroundSyncs();
    expect(calls.filter((c) => c.url.includes("/issues"))).toHaveLength(1);
  });

  it("rejects a repository GitHub cannot show", async () => {
    const id = await makeUser(true);
    const teamId = await makeTeam(id);
    respond = () => json({ message: "Not Found" }, 404);
    const res = await createProject(
      post(
        "/api/projects",
        id,
        projectBody(teamId, { githubRepo: "octo/repo" }),
      ),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      'GitHub repository "octo/repo" was not found or you do not have access to it',
    );
    expect(await projectCount(teamId)).toBe(0);
  });

  it("rejects an unconnected admin without a request", async () => {
    const id = await makeUser(false);
    const teamId = await makeTeam(id);
    const res = await createProject(
      post(
        "/api/projects",
        id,
        projectBody(teamId, { githubRepo: "octo/repo" }),
      ),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Connect your GitHub account in Account Settings before linking a repository",
    );
    expect(calls).toHaveLength(0);
    expect(await projectCount(teamId)).toBe(0);
  });

  it("rejects a malformed repository", async () => {
    const id = await makeUser(true);
    const teamId = await makeTeam(id);
    const res = await createProject(
      post("/api/projects", id, projectBody(teamId, { githubRepo: "nope" })),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toContain(
      "owner/repo",
    );
    expect(calls).toHaveLength(0);
  });

  it("rejects both githubRepo and createNewRepo", async () => {
    const id = await makeUser(true);
    const teamId = await makeTeam(id);
    const res = await createProject(
      post(
        "/api/projects",
        id,
        projectBody(teamId, {
          githubRepo: "octo/repo",
          createNewRepo: { name: "x" },
        }),
      ),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Provide either githubRepo or createNewRepo, not both",
    );
    expect(calls).toHaveLength(0);
  });

  it("creates a new private repository and links it", async () => {
    const id = await makeUser(true);
    const teamId = await makeTeam(id);
    respond = (c) => {
      if (
        c.method === "POST" &&
        c.url === "https://api.github.com/user/repos"
      ) {
        return json(ghRepo("alice/new-repo"), 201);
      }
      if (c.url.includes("/issues") || c.url.includes("/pulls"))
        return json([]);
      return new Response("{}", { status: 500 });
    };
    const res = await createProject(
      post(
        "/api/projects",
        id,
        projectBody(teamId, { createNewRepo: { name: "new-repo" } }),
      ),
    );
    expect(res.status).toBe(201);
    const row = (await res.json()) as {
      githubRepo: string;
      createNewRepo?: unknown;
    };
    expect(row.githubRepo).toBe("alice/new-repo");
    expect(calls.find((c) => c.method === "POST")?.body).toMatchObject({
      name: "new-repo",
      private: true,
    });
  });

  it("rejects an invalid new repository name", async () => {
    const id = await makeUser(true);
    const teamId = await makeTeam(id);
    const res = await createProject(
      post(
        "/api/projects",
        id,
        projectBody(teamId, { createNewRepo: { name: "bad name" } }),
      ),
    );
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
    expect(await projectCount(teamId)).toBe(0);
  });

  it("answers 409 when GitHub says the repository exists", async () => {
    const id = await makeUser(true);
    const teamId = await makeTeam(id);
    respond = () => json({ message: "exists" }, 422);
    const res = await createProject(
      post(
        "/api/projects",
        id,
        projectBody(teamId, { createNewRepo: { name: "dup" } }),
      ),
    );
    expect(res.status).toBe(409);
    expect(await projectCount(teamId)).toBe(0);
  });

  it("answers 502 when GitHub fails creating", async () => {
    const id = await makeUser(true);
    const teamId = await makeTeam(id);
    const res = await createProject(
      post(
        "/api/projects",
        id,
        projectBody(teamId, { createNewRepo: { name: "x" } }),
      ),
    );
    expect(res.status).toBe(502);
  });

  it("answers 403 for a non-admin member before any request", async () => {
    const owner = await makeUser(true);
    const member = await makeUser(true);
    const teamId = await makeTeam(owner);
    await TeamService.addTeamMember({ teamId, userId: member, role: "member" });
    const res = await createProject(
      post(
        "/api/projects",
        member,
        projectBody(teamId, { createNewRepo: { name: "x" } }),
      ),
    );
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });
});

describe("POST /api/projects/[id]/github-sync", () => {
  async function setup(linked: boolean) {
    const owner = await makeUser(true);
    const teamId = await makeTeam(owner);
    const p = await ProjectService.createProject({
      teamId,
      name: "S",
      slug: `s-${crypto.randomUUID().slice(0, 8)}`,
      githubRepo: linked ? "octo/repo" : null,
    });
    return { owner, teamId, projectId: p.id };
  }
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
  const url = (id: string) => `/api/projects/${id}/github-sync`;

  it("answers 401 without a user", async () => {
    const { projectId } = await setup(true);
    const res = await syncProject(post(url(projectId), null), ctx(projectId));
    expect(res.status).toBe(401);
  });

  it("answers 404 for an unknown project", async () => {
    const owner = await makeUser(true);
    const id = crypto.randomUUID();
    const res = await syncProject(post(url(id), owner), ctx(id));
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: string }).error).toBe(
      `Project not found for id: ${id}`,
    );
  });

  it("answers 403 for a non-member", async () => {
    const { projectId } = await setup(true);
    const other = await makeUser(true);
    const res = await syncProject(post(url(projectId), other), ctx(projectId));
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Forbidden: Not a member of this team",
    );
    expect(calls).toHaveLength(0);
  });

  it("answers 403 for a viewer", async () => {
    const { teamId, projectId } = await setup(true);
    const viewer = await makeUser(true);
    await TeamService.addTeamMember({ teamId, userId: viewer, role: "viewer" });
    const res = await syncProject(post(url(projectId), viewer), ctx(projectId));
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Forbidden: Viewers cannot sync GitHub issues",
    );
    expect(calls).toHaveLength(0);
  });

  it("answers 400 for an unlinked project", async () => {
    const { owner, projectId } = await setup(false);
    const res = await syncProject(post(url(projectId), owner), ctx(projectId));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Project is not linked to any GitHub repository",
    );
  });

  it("syncs for a member and returns the result", async () => {
    const { teamId, projectId } = await setup(true);
    const member = await makeUser(true);
    await TeamService.addTeamMember({ teamId, userId: member, role: "member" });
    respond = (c) => (c.url.includes("/issues") ? json([ISSUE]) : json([]));
    const res = await syncProject(post(url(projectId), member), ctx(projectId));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      repository: "octo/repo",
      createdCount: 1,
      updatedCount: 0,
      totalIssues: 1,
    });
  });

  it("answers 502 when GitHub fails", async () => {
    const { owner, projectId } = await setup(true);
    const res = await syncProject(post(url(projectId), owner), ctx(projectId));
    expect(res.status).toBe(502);
    expect(((await res.json()) as { error: string }).error).toStartWith(
      "GitHub API returned",
    );
  });
});

describe("QA additions", () => {
  it("proxy answers 401 for /api/github/repos without a session", async () => {
    const res = await proxy(
      new NextRequest("http://localhost:3000/api/github/repos"),
    );
    expect(res.status).toBe(401);
  });

  it("sends private false when createNewRepo.isPrivate is false", async () => {
    const id = await makeUser(true);
    const teamId = await makeTeam(id);
    respond = (c) =>
      c.method === "POST" ? json(ghRepo("alice/pub", false), 201) : json([]);
    const res = await createProject(
      post(
        "/api/projects",
        id,
        projectBody(teamId, {
          createNewRepo: { name: "pub", isPrivate: false },
        }),
      ),
    );
    expect(res.status).toBe(201);
    expect(calls.find((c) => c.method === "POST")?.body).toMatchObject({
      private: false,
    });
  });

  it("answers 409 for a duplicate slug before creating a GitHub repository", async () => {
    const id = await makeUser(true);
    const teamId = await makeTeam(id);
    const body = projectBody(teamId);
    const first = await createProject(post("/api/projects", id, body));
    expect(first.status).toBe(201);
    respond = (c) =>
      c.method === "POST" ? json(ghRepo("alice/orphan"), 201) : json([]);
    const res = await createProject(
      post("/api/projects", id, { ...body, createNewRepo: { name: "orphan" } }),
    );
    expect(res.status).toBe(409);
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0);
  });

  it("answers 404 for an unknown team before any GitHub request", async () => {
    const id = await makeUser(true);
    const res = await createProject(
      post(
        "/api/projects",
        id,
        projectBody(crypto.randomUUID(), { createNewRepo: { name: "x" } }),
      ),
    );
    expect(res.status).toBe(404);
    expect(calls).toHaveLength(0);
  });
});
