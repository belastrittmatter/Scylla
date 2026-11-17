import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { account, task, user } from "../../src/db/schema";
import { GithubSyncService } from "../../src/services/github/github-sync-service";
import { ProjectService } from "../../src/services/project/project-service";
import { TaskService } from "../../src/services/task/task-service";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
} from "../../src/services/task/task-types";
import { TeamService } from "../../src/services/team/team-service";

const ISSUES_URL = "https://api.github.com/repos/octo/repo/issues";
const PULLS_URL = "https://api.github.com/repos/octo/repo/pulls";

interface Call {
  url: string;
  headers: Headers;
}

let originalFetch: typeof globalThis.fetch;
let calls: Call[];
let issues: unknown[];
let pulls: unknown[];
let issuesStatus: number;
let pullsStatus: number;
const userIds: string[] = [];

beforeEach(() => {
  originalFetch = globalThis.fetch;
  calls = [];
  issues = [];
  pulls = [];
  issuesStatus = 200;
  pullsStatus = 200;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, headers: new Headers(init?.headers) });
    if (url.startsWith(ISSUES_URL)) {
      return Response.json(issuesStatus === 200 ? issues : {}, {
        status: issuesStatus,
      });
    }
    if (url.startsWith(PULLS_URL)) {
      return Response.json(pullsStatus === 200 ? pulls : {}, {
        status: pullsStatus,
      });
    }
    return new Response("unexpected", { status: 500 });
  }) as typeof globalThis.fetch;
});

afterEach(async () => {
  await GithubSyncService.waitForBackgroundSyncs();
  globalThis.fetch = originalFetch;
  for (const id of userIds.splice(0)) {
    await db.delete(user).where(eq(user.id, id));
  }
});

async function setup(opts: { repo?: string | null; connected?: boolean } = {}) {
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "N",
      email: `n-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  userIds.push(u.id);
  if (opts.connected) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "12345",
      providerId: "github",
      userId: u.id,
      accessToken: "gho_test",
    });
  }
  const team = await TeamService.createTeam({
    name: `T ${crypto.randomUUID()}`,
    ownerId: u.id,
  });
  const repo = opts.repo === undefined ? "octo/repo" : opts.repo;
  const proj = await ProjectService.createProject({
    name: `P ${crypto.randomUUID()}`,
    teamId: team.id,
    ...(repo ? { githubRepo: repo } : {}),
  });
  return { u, team, proj };
}

async function existingTask(
  ctx: Awaited<ReturnType<typeof setup>>,
  over: {
    status?: "todo" | "in_review" | "done";
    priority?: "low" | "high";
  } = {},
  issueNumber = 42,
) {
  const t = await TaskService.createTask({
    title: "Old title",
    description: "Old body",
    teamId: ctx.team.id,
    projectId: ctx.proj.id,
    creatorId: ctx.u.id,
    status: over.status ?? "todo",
    priority: over.priority ?? "medium",
  });
  await db
    .update(task)
    .set({ githubIssueNumber: issueNumber })
    .where(eq(task.id, t.id));
  return t;
}

function issue(over: Record<string, unknown> = {}) {
  return {
    number: 42,
    title: "Issue title",
    body: "Issue body",
    state: "open",
    labels: [],
    html_url: "https://github.com/octo/repo/issues/42",
    ...over,
  };
}

async function row(id: string) {
  const r = await db.query.task.findFirst({ where: eq(task.id, id) });
  if (!r) throw new Error("task missing");
  return r;
}

async function tasksOf(projectId: string) {
  return db.query.task.findMany({ where: eq(task.projectId, projectId) });
}

describe("GithubSyncService.syncProjectIssues", () => {
  test("creates tasks for open issues", async () => {
    const ctx = await setup();
    issues = [
      issue({
        labels: [
          { name: "priority:high" },
          { name: "status:in-progress" },
          { name: "bug" },
        ],
      }),
      issue({ number: 43, title: "Plain", body: null }),
    ];
    const result = await GithubSyncService.syncProjectIssues(ctx.proj.id);
    expect(result).toEqual({
      repository: "octo/repo",
      createdCount: 2,
      updatedCount: 0,
      totalIssues: 2,
    });
    const rows = await tasksOf(ctx.proj.id);
    const a = rows.find((r) => r.githubIssueNumber === 42);
    const b = rows.find((r) => r.githubIssueNumber === 43);
    expect(a?.title).toBe("Issue title");
    expect(a?.description).toBe("Issue body");
    expect(a?.status).toBe("in_progress");
    expect(a?.priority).toBe("high");
    expect(a?.githubIssueUrl).toBe("https://github.com/octo/repo/issues/42");
    expect(a?.creatorId).toBe(ctx.u.id);
    expect(b?.status).toBe("todo");
    expect(b?.priority).toBe("medium");
  });

  test("ignores pull requests and closed issues without a task", async () => {
    const ctx = await setup();
    issues = [
      issue({ pull_request: { url: "x" } }),
      issue({ number: 44, state: "closed" }),
    ];
    const result = await GithubSyncService.syncProjectIssues(ctx.proj.id);
    expect(result.totalIssues).toBe(0);
    expect(await tasksOf(ctx.proj.id)).toHaveLength(0);
  });

  test("updates an existing task from the issue", async () => {
    const ctx = await setup();
    const t = await existingTask(ctx);
    issues = [issue({ labels: ["priority:urgent", "status:in-progress"] })];
    const result = await GithubSyncService.syncProjectIssues(ctx.proj.id);
    expect(result.updatedCount).toBe(1);
    expect(result.createdCount).toBe(0);
    const r = await row(t.id);
    expect(r.title).toBe("Issue title");
    expect(r.description).toBe("Issue body");
    expect(r.status).toBe("in_progress");
    expect(r.priority).toBe("urgent");
    expect(r.githubIssueUrl).toBe("https://github.com/octo/repo/issues/42");
  });

  test("closed issue sets done, not_planned sets cancelled", async () => {
    const ctx = await setup();
    const t = await existingTask(ctx);
    issues = [issue({ state: "closed" })];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    expect((await row(t.id)).status).toBe("done");
    issues = [issue({ state: "closed", state_reason: "not_planned" })];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    expect((await row(t.id)).status).toBe("cancelled");
  });

  test("open issue keeps in_review, reopens done as todo, keeps priority", async () => {
    const ctx = await setup();
    const review = await existingTask(ctx, {
      status: "in_review",
      priority: "low",
    });
    const done = await existingTask(
      ctx,
      { status: "done", priority: "high" },
      43,
    );
    issues = [issue(), issue({ number: 43 })];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    const r = await row(review.id);
    expect(r.status).toBe("in_review");
    expect(r.priority).toBe("low");
    const d = await row(done.id);
    expect(d.status).toBe("todo");
    expect(d.priority).toBe("high");
  });

  test("does not call updateTask when nothing differs", async () => {
    const ctx = await setup();
    const t = await existingTask(ctx);
    await db
      .update(task)
      .set({
        title: "Issue title",
        description: "Issue body",
        githubIssueUrl: "https://github.com/octo/repo/issues/42",
      })
      .where(eq(task.id, t.id));
    const before = await row(t.id);
    const spy = spyOn(TaskService, "updateTask");
    issues = [issue()];
    const result = await GithubSyncService.syncProjectIssues(ctx.proj.id);
    const callCount = spy.mock.calls.length;
    spy.mockRestore();
    expect(callCount).toBe(0);
    expect(result.updatedCount).toBe(1);
    expect((await row(t.id)).updatedAt).toEqual(before.updatedAt);
  });

  test("a second run creates no duplicates", async () => {
    const ctx = await setup();
    issues = [issue()];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    const second = await GithubSyncService.syncProjectIssues(ctx.proj.id);
    expect(second.createdCount).toBe(0);
    expect(second.updatedCount).toBe(1);
    expect(await tasksOf(ctx.proj.id)).toHaveLength(1);
  });

  test("stores a long body in full and cuts a long title to 200", async () => {
    const ctx = await setup();
    issues = [issue({ body: "b".repeat(20000), title: "t".repeat(300) })];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    const [r] = await tasksOf(ctx.proj.id);
    expect(r.description?.length).toBe(20000);
    expect(r.title).toBe("t".repeat(200));
  });

  test("attaches a pull request that fixes the issue", async () => {
    const ctx = await setup();
    issues = [issue()];
    pulls = [
      {
        number: 6,
        title: "Mentions",
        body: "see #42",
        html_url: "https://github.com/octo/repo/pull/6",
        state: "open",
        draft: false,
        merged_at: null,
        head: { ref: "y" },
      },
      {
        number: 7,
        title: "Fixes #42",
        body: "",
        html_url: "https://github.com/octo/repo/pull/7",
        state: "open",
        draft: true,
        merged_at: null,
        head: { ref: "x" },
      },
    ];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    const [r] = await tasksOf(ctx.proj.id);
    expect(r.githubPrNumber).toBe(7);
    expect(r.githubPrUrl).toBe("https://github.com/octo/repo/pull/7");
    expect(r.githubPrStatus).toBe("draft");
  });

  test("a pull that only says see #42 is not attached", async () => {
    const ctx = await setup();
    issues = [issue()];
    pulls = [
      {
        number: 6,
        title: "Other",
        body: "see #42",
        html_url: "u",
        state: "open",
        draft: false,
        merged_at: null,
        head: { ref: "y" },
      },
    ];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    const [r] = await tasksOf(ctx.proj.id);
    expect(r.githubPrNumber).toBeNull();
  });

  test("a failing pulls endpoint keeps the stored PR and still resolves", async () => {
    const ctx = await setup();
    const t = await existingTask(ctx);
    await db.update(task).set({ githubPrNumber: 9 }).where(eq(task.id, t.id));
    issues = [issue()];
    pullsStatus = 500;
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    expect((await row(t.id)).githubPrNumber).toBe(9);
  });

  test("rejects for an unknown project without a request", async () => {
    const id = crypto.randomUUID();
    await expect(GithubSyncService.syncProjectIssues(id)).rejects.toThrow(
      `Project with id "${id}" not found`,
    );
    expect(calls).toHaveLength(0);
  });

  test("rejects for a project without a repository without a request", async () => {
    const ctx = await setup({ repo: null });
    await expect(
      GithubSyncService.syncProjectIssues(ctx.proj.id),
    ).rejects.toThrow("Project is not linked to any GitHub repository");
    expect(calls).toHaveLength(0);
  });

  test("rejects when GitHub answers 404", async () => {
    const ctx = await setup();
    issuesStatus = 404;
    await expect(
      GithubSyncService.syncProjectIssues(ctx.proj.id),
    ).rejects.toThrow(/^GitHub API returned 404/);
  });

  test("sends the connected user's token", async () => {
    const ctx = await setup({ connected: true });
    issues = [];
    await GithubSyncService.syncProjectIssues(ctx.proj.id, ctx.u.id);
    const first = calls.find((c) => c.url.startsWith(ISSUES_URL));
    expect(first?.url).toBe(`${ISSUES_URL}?state=all&per_page=100`);
    expect(first?.headers.get("Authorization")).toBe("Bearer gho_test");
  });
});

describe("GithubSyncService QA additions", () => {
  async function otherUser(connected = true) {
    const [o] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "O",
        email: `o-${crypto.randomUUID()}@example.com`,
      })
      .returning();
    userIds.push(o.id);
    if (connected) {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: "999",
        providerId: "github",
        userId: o.id,
        accessToken: "gho_other",
      });
    }
    return o;
  }

  test("writes as the team owner, not the triggering user", async () => {
    const ctx = await setup();
    const other = await otherUser();
    const existing = await existingTask(ctx);
    issues = [issue({ title: "Changed" }), issue({ number: 50 })];
    const spy = spyOn(TaskService, "updateTask");
    await GithubSyncService.syncProjectIssues(ctx.proj.id, other.id);
    const actors = spy.mock.calls.map((c) => c[2]);
    spy.mockRestore();
    expect(actors).toEqual([ctx.u.id]);
    const created = (await tasksOf(ctx.proj.id)).find(
      (r) => r.githubIssueNumber === 50,
    );
    expect(created?.creatorId).toBe(ctx.u.id);
    expect((await row(existing.id)).title).toBe("Changed");
    const first = calls.find((c) => c.url.startsWith(ISSUES_URL));
    expect(first?.headers.get("Authorization")).toBe("Bearer gho_other");
  });

  test("cuts a body over 65536 characters and clears an empty body", async () => {
    const ctx = await setup();
    const t = await existingTask(ctx);
    issues = [
      issue({ body: "b".repeat(70000) }),
      issue({ number: 51, body: "c".repeat(70000) }),
    ];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    expect((await row(t.id)).description?.length).toBe(65536);
    const created = (await tasksOf(ctx.proj.id)).find(
      (r) => r.githubIssueNumber === 51,
    );
    expect(created?.description?.length).toBe(65536);
    issues = [issue({ body: "" })];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    expect((await row(t.id)).description).toBeNull();
  });

  test("uses 'Untitled issue' for a blank title and trims", async () => {
    const ctx = await setup();
    issues = [
      issue({ title: "   " }),
      issue({ number: 52, title: "  padded  " }),
    ];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    const rows = await tasksOf(ctx.proj.id);
    expect(rows.find((r) => r.githubIssueNumber === 42)?.title).toBe(
      "Untitled issue",
    );
    expect(rows.find((r) => r.githubIssueNumber === 52)?.title).toBe("padded");
  });

  test("a closed issue never creates a task but updates an existing one", async () => {
    const ctx = await setup();
    const t = await existingTask(ctx);
    issues = [
      issue({ state: "closed" }),
      issue({ number: 60, state: "closed" }),
    ];
    const result = await GithubSyncService.syncProjectIssues(ctx.proj.id);
    expect(result).toEqual({
      repository: "octo/repo",
      createdCount: 0,
      updatedCount: 1,
      totalIssues: 1,
    });
    expect(await tasksOf(ctx.proj.id)).toHaveLength(1);
    expect((await row(t.id)).status).toBe("done");
  });

  test("matches tasks of this project only", async () => {
    const ctx = await setup();
    const other = await setup();
    const foreign = await existingTask(other);
    issues = [issue()];
    const result = await GithubSyncService.syncProjectIssues(ctx.proj.id);
    expect(result.createdCount).toBe(1);
    expect((await row(foreign.id)).title).toBe("Old title");
  });

  test("links a pull request by the task's branch and maps merged state", async () => {
    const ctx = await setup();
    const t = await existingTask(ctx);
    await db
      .update(task)
      .set({ githubBranch: "feat/my-branch" })
      .where(eq(task.id, t.id));
    issues = [issue()];
    pulls = [
      {
        number: 8,
        title: "Unrelated",
        body: "",
        html_url: "https://github.com/octo/repo/pull/8",
        state: "closed",
        draft: false,
        merged_at: "2026-01-01T00:00:00Z",
        head: { ref: "feat/my-branch" },
      },
    ];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    const r = await row(t.id);
    expect(r.githubPrNumber).toBe(8);
    expect(r.githubPrStatus).toBe("merged");
    expect(
      calls.some((c) => c.url === `${PULLS_URL}?state=all&per_page=100`),
    ).toBe(true);
  });

  test("the first matching pull wins", async () => {
    const ctx = await setup();
    issues = [issue()];
    const mk = (n: number) => ({
      number: n,
      title: "Fixes #42",
      body: "",
      html_url: `https://github.com/octo/repo/pull/${n}`,
      state: "open",
      draft: false,
      merged_at: null,
      head: { ref: "z" },
    });
    pulls = [mk(11), mk(12)];
    await GithubSyncService.syncProjectIssues(ctx.proj.id);
    const [r] = await tasksOf(ctx.proj.id);
    expect(r.githubPrNumber).toBe(11);
    expect(r.githubPrStatus).toBe("open");
  });

  test("a project with an invalid repo value rejects without a request", async () => {
    const ctx = await setup();
    await db.execute(
      (await import("drizzle-orm"))
        .sql`update project set github_repo = 'not a repo' where id = ${ctx.proj.id}`,
    );
    await expect(
      GithubSyncService.syncProjectIssues(ctx.proj.id),
    ).rejects.toThrow("Project is not linked to any GitHub repository");
    expect(calls).toHaveLength(0);
  });
});

describe("GithubSyncService background", () => {
  test("does not reject when GitHub fails", async () => {
    const ctx = await setup();
    issuesStatus = 500;
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      GithubSyncService.syncProjectIssuesInBackground(ctx.proj.id),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test("two back-to-back calls request the issues once", async () => {
    const ctx = await setup();
    issues = [issue()];
    const a = GithubSyncService.syncProjectIssuesInBackground(ctx.proj.id);
    const b = GithubSyncService.syncProjectIssuesInBackground(ctx.proj.id);
    await GithubSyncService.waitForBackgroundSyncs();
    await Promise.all([a, b]);
    expect(calls.filter((c) => c.url.startsWith(ISSUES_URL))).toHaveLength(1);
    expect(await tasksOf(ctx.proj.id)).toHaveLength(1);
  });

  test("different projects sync concurrently and a finished sync can rerun", async () => {
    const a = await setup();
    const b = await setup();
    issues = [issue()];
    const pa = GithubSyncService.syncProjectIssuesInBackground(a.proj.id);
    const pb = GithubSyncService.syncProjectIssuesInBackground(b.proj.id);
    await Promise.all([pa, pb]);
    expect(calls.filter((c) => c.url.startsWith(ISSUES_URL))).toHaveLength(2);
    await GithubSyncService.syncProjectIssuesInBackground(a.proj.id);
    expect(calls.filter((c) => c.url.startsWith(ISSUES_URL))).toHaveLength(3);
  });

  test("waitForBackgroundSyncs resolves immediately when idle", async () => {
    await expect(
      GithubSyncService.waitForBackgroundSyncs(),
    ).resolves.toBeUndefined();
  });
});

describe("task description limit", () => {
  const base = {
    title: "t",
    teamId: crypto.randomUUID(),
    creatorId: crypto.randomUUID(),
    status: "todo",
    priority: "medium",
  };
  test("create accepts 65536 and rejects 65537", () => {
    expect(
      CreateTaskSchema.safeParse({ ...base, description: "a".repeat(65536) })
        .success,
    ).toBe(true);
    expect(
      CreateTaskSchema.safeParse({ ...base, description: "a".repeat(65537) })
        .success,
    ).toBe(false);
  });
  test("update accepts 65536 and rejects 65537", () => {
    expect(
      UpdateTaskSchema.safeParse({ description: "a".repeat(65536) }).success,
    ).toBe(true);
    expect(
      UpdateTaskSchema.safeParse({ description: "a".repeat(65537) }).success,
    ).toBe(false);
  });
});
