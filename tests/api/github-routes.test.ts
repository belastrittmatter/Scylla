import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db } from "@/db";
import { user } from "@/db/schema";
import { GET as getRepos } from "@/app/api/github/repos/route";
import { POST as postSync } from "@/app/api/projects/[id]/github-sync/route";
import { TeamService } from "@/services/team/team-service";
import {
  createGithubFixture,
  type GithubFixture,
} from "../test-utils/github-fixtures";
import { mockGithubApi } from "../test-utils/mock-github-api";

let fixture: GithubFixture;
let restore: (() => void) | null = null;
let savedToken: string | undefined;
const extraUsers: string[] = [];

beforeEach(async () => {
  savedToken = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
  fixture = await createGithubFixture();
});

afterEach(async () => {
  restore?.();
  restore = null;
  if (savedToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = savedToken;
  await fixture.cleanup();
  const { eq } = await import("drizzle-orm");
  for (const id of extraUsers.splice(0)) {
    await db.delete(user).where(eq(user.id, id));
  }
});

async function newUser(): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .insert(user)
    .values({ id, name: "Other", email: `other-${id}@example.com` });
  extraUsers.push(id);
  return id;
}

const call = (handler: typeof postSync, id: string, userId?: string) =>
  handler(
    new Request("http://localhost/api", {
      method: "POST",
      headers: userId ? { "x-user-id": userId } : {},
    }),
    { params: Promise.resolve({ id }) },
  );

describe("GET /api/github/repos", () => {
  const get = (userId?: string) =>
    getRepos(
      new Request("http://localhost/api/github/repos", {
        headers: userId ? { "x-user-id": userId } : {},
      }),
    );

  test("401 without a user", async () => {
    const res = await get();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  test("200 with connected and repositories", async () => {
    restore = mockGithubApi([
      {
        method: "GET",
        path: "/user/repos",
        body: [
          {
            id: 1,
            full_name: "acme/widgets",
            name: "widgets",
            owner: { login: "acme" },
            private: false,
            html_url: "https://github.com/acme/widgets",
            description: null,
          },
        ],
      },
    ]).restore;
    const res = await get(fixture.userId);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.connected).toBe(true);
    expect(json.repositories[0].fullName).toBe("acme/widgets");
  });

  test("502 when GitHub fails", async () => {
    restore = mockGithubApi([
      { method: "GET", path: "/user/repos", status: 500 },
    ]).restore;
    const res = await get(fixture.userId);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "GitHub API returned 500" });
  });
});

describe("POST /api/projects/[id]/github-sync", () => {
  test("401 without a user", async () => {
    const res = await call(postSync, fixture.projectId);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  test("404 for an unknown project", async () => {
    const res = await call(postSync, crypto.randomUUID(), fixture.userId);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Project not found" });
  });

  test("403 for a non-member", async () => {
    const res = await call(postSync, fixture.projectId, await newUser());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "Forbidden: Not a member of this team",
    });
  });

  test("403 for a viewer", async () => {
    const viewer = await newUser();
    await TeamService.addTeamMember({
      teamId: fixture.teamId,
      userId: viewer,
      role: "viewer",
    });
    const res = await call(postSync, fixture.projectId, viewer);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "Forbidden: Viewers cannot sync GitHub issues",
    });
  });

  test("200 for a plain member", async () => {
    const member = await newUser();
    await TeamService.addTeamMember({
      teamId: fixture.teamId,
      userId: member,
      role: "member",
    });
    restore = mockGithubApi([
      { method: "GET", path: "/repos/acme/widgets/issues", body: [] },
    ]).restore;
    const res = await call(postSync, fixture.projectId, member);
    expect(res.status).toBe(200);
  });

  test("viewer and non-member requests send no GitHub request", async () => {
    const m = mockGithubApi([]);
    restore = m.restore;
    await call(postSync, fixture.projectId, await newUser());
    expect(m.calls).toHaveLength(0);
  });

  test("400 for an unlinked project", async () => {
    const other = await createGithubFixture({ repo: null });
    try {
      const res = await call(postSync, other.projectId, other.userId);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "Project is not linked to a GitHub repository",
      });
    } finally {
      await other.cleanup();
    }
  });

  test("200 with the sync result", async () => {
    restore = mockGithubApi([
      {
        method: "GET",
        path: "/repos/acme/widgets/issues",
        body: [
          {
            number: 1,
            title: "A",
            state: "open",
            html_url: "https://github.com/acme/widgets/issues/1",
            labels: [],
          },
        ],
      },
    ]).restore;
    const res = await call(postSync, fixture.projectId, fixture.userId);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: {
        repository: "acme/widgets",
        createdCount: 1,
        updatedCount: 0,
        totalIssues: 1,
      },
    });
  });

  test("502 when the issues list fails", async () => {
    restore = mockGithubApi([
      { method: "GET", path: "/repos/acme/widgets/issues", status: 500 },
    ]).restore;
    const res = await call(postSync, fixture.projectId, fixture.userId);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "GitHub API returned 500" });
  });
});
