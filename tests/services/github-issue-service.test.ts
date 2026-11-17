import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { account, project, task, user } from "../../src/db/schema";
import { GithubIssueService } from "../../src/services/github/github-issue-service";
import { TaskService } from "../../src/services/task/task-service";
import { TeamService } from "../../src/services/team/team-service";

interface Recorded {
  url: string;
  method: string;
  headers: Headers;
  body: string | undefined;
}

const ENV_KEYS = ["GITHUB_TOKEN", "GITHUB_ACCESS_TOKEN"] as const;
const API = "https://api.github.com/repos/octo/repo";

let originalFetch: typeof globalThis.fetch;
let savedEnv: Record<string, string | undefined>;
let calls: Recorded[];
let responder: (r: Recorded) => Response | Promise<Response>;
const userIds: string[] = [];

beforeEach(() => {
  originalFetch = globalThis.fetch;
  savedEnv = {};
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  calls = [];
  responder = () => new Response("unexpected", { status: 500 });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const rec: Recorded = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : undefined,
    };
    calls.push(rec);
    return responder(rec);
  }) as typeof globalThis.fetch;
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  for (const id of userIds.splice(0)) {
    await db.delete(user).where(eq(user.id, id));
  }
});

async function makeUser(accountId?: string): Promise<string> {
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "N",
      email: `n-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  userIds.push(u.id);
  if (accountId) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId,
      providerId: "github",
      userId: u.id,
      accessToken: "gho_test",
    });
  }
  return u.id;
}

interface Setup {
  creatorId: string;
  teamId: string;
  projectId: string;
  taskId: string;
}

async function setup(
  opts: {
    githubRepo?: string | null;
    noProject?: boolean;
    description?: string | null;
    assigneeId?: string;
    status?: "todo" | "in_progress";
    priority?: "medium" | "high";
    connected?: boolean;
  } = {},
): Promise<Setup> {
  const creatorId = await makeUser(opts.connected === false ? undefined : "1");
  const team = await TeamService.createTeam({
    name: `T ${crypto.randomUUID()}`,
    ownerId: creatorId,
  });
  if (opts.assigneeId) {
    await TeamService.addTeamMember({
      teamId: team.id,
      userId: opts.assigneeId,
      role: "member",
    });
  }
  // Inserted directly: another test file mocks the project-service module,
  // and the service under test does not depend on it.
  const slug = `p-${crypto.randomUUID()}`;
  const [proj] = await db
    .insert(project)
    .values({
      name: slug,
      slug,
      teamId: team.id,
      githubRepo: opts.githubRepo === undefined ? "octo/repo" : opts.githubRepo,
    })
    .returning();
  const t = await TaskService.createTask({
    title: "Fix login",
    description: opts.description ?? "Desc",
    teamId: team.id,
    projectId: opts.noProject ? undefined : proj.id,
    creatorId,
    assigneeId: opts.assigneeId,
    status: opts.status ?? "todo",
    priority: opts.priority ?? "medium",
  });
  if (opts.description === null) {
    await db.update(task).set({ description: null }).where(eq(task.id, t.id));
  }
  return {
    creatorId,
    teamId: team.id,
    projectId: proj.id,
    taskId: t.id,
  };
}

async function getTask(id: string) {
  const [t] = await db.select().from(task).where(eq(task.id, id));
  return t;
}

async function linkIssue(taskId: string, n = 7): Promise<void> {
  await db
    .update(task)
    .set({
      githubIssueNumber: n,
      githubIssueUrl: `https://github.com/octo/repo/issues/${n}`,
    })
    .where(eq(task.id, taskId));
}

function json(r: Recorded): Record<string, unknown> {
  return JSON.parse(r.body ?? "{}") as Record<string, unknown>;
}

/** Router: issue creation, GET/PATCH of issue 7, user lookup, collaborator invite. */
function route(
  opts: {
    postStatuses?: number[];
    labels?: unknown[];
    getStatus?: number;
    patchStatus?: number;
  } = {},
): void {
  const postStatuses = [...(opts.postStatuses ?? [201])];
  responder = (r) => {
    if (r.url === `${API}/issues` && r.method === "POST") {
      const status = postStatuses.shift() ?? 201;
      return status === 201
        ? Response.json(
            { number: 42, html_url: "https://github.com/octo/repo/issues/42" },
            { status },
          )
        : Response.json({ message: "bad" }, { status });
    }
    if (r.url === `${API}/issues/7` && r.method === "GET") {
      return Response.json(
        { labels: opts.labels ?? [] },
        { status: opts.getStatus ?? 200 },
      );
    }
    if (r.url === `${API}/issues/7` && r.method === "PATCH") {
      return Response.json({}, { status: opts.patchStatus ?? 200 });
    }
    if (r.url.startsWith("https://api.github.com/user/")) {
      return Response.json({ login: "alice" });
    }
    if (r.method === "PUT" && r.url.includes("/collaborators/")) {
      return Response.json({}, { status: 201 });
    }
    return new Response("unexpected", { status: 500 });
  };
}

describe("createIssueForTask", () => {
  test("creates one issue with title, verbatim body and managed labels", async () => {
    const s = await setup({ priority: "high" });
    route();
    const res = await GithubIssueService.createIssueForTask(s.taskId);
    expect(res).toEqual({
      number: 42,
      url: "https://github.com/octo/repo/issues/42",
    });
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toBe(`${API}/issues`);
    expect(posts[0].headers.get("authorization")).toContain("gho_test");
    const body = json(posts[0]);
    expect(body.title).toBe("Fix login");
    expect(body.body).toBe("Desc");
    expect(body.labels).toEqual(["priority:high", "status:todo"]);
    expect(body.assignees).toBeUndefined();
    const row = await getTask(s.taskId);
    expect(row.githubIssueNumber).toBe(42);
    expect(row.githubIssueUrl).toBe("https://github.com/octo/repo/issues/42");
  });

  test("null description sends an empty body", async () => {
    const s = await setup({ description: null });
    route();
    await GithubIssueService.createIssueForTask(s.taskId);
    expect(json(calls[0]).body).toBe("");
  });

  test("assignee is invited and sent as assignees", async () => {
    const assignee = await makeUser("999");
    const s = await setup({ assigneeId: assignee });
    route();
    const res = await GithubIssueService.createIssueForTask(s.taskId);
    expect(res?.number).toBe(42);
    const post = calls.find((c) => c.method === "POST")!;
    expect(json(post).assignees).toEqual(["alice"]);
    expect(
      calls.some(
        (c) => c.method === "PUT" && c.url === `${API}/collaborators/alice`,
      ),
    ).toBe(true);
  });

  test("422 with assignees retries once without assignees", async () => {
    const assignee = await makeUser("999");
    const s = await setup({ assigneeId: assignee });
    route({ postStatuses: [422, 201] });
    const res = await GithubIssueService.createIssueForTask(s.taskId);
    expect(res?.number).toBe(42);
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts).toHaveLength(2);
    expect(json(posts[0]).assignees).toEqual(["alice"]);
    expect(json(posts[1]).assignees).toBeUndefined();
    expect((await getTask(s.taskId)).githubIssueNumber).toBe(42);
  });

  test("unknown task returns null without fetch", async () => {
    expect(
      await GithubIssueService.createIssueForTask(crypto.randomUUID()),
    ).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test("task without project returns null without fetch", async () => {
    const s = await setup({ noProject: true });
    expect(await GithubIssueService.createIssueForTask(s.taskId)).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test("project without githubRepo returns null without fetch", async () => {
    const s = await setup({ githubRepo: null });
    expect(await GithubIssueService.createIssueForTask(s.taskId)).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test("no token returns null without fetch", async () => {
    const s = await setup({ connected: false });
    expect(await GithubIssueService.createIssueForTask(s.taskId)).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test("is idempotent for a task that already has an issue", async () => {
    const s = await setup();
    await linkIssue(s.taskId, 7);
    expect(await GithubIssueService.createIssueForTask(s.taskId)).toEqual({
      number: 7,
      url: "https://github.com/octo/repo/issues/7",
    });
    await db
      .update(task)
      .set({ githubIssueUrl: null })
      .where(eq(task.id, s.taskId));
    expect(await GithubIssueService.createIssueForTask(s.taskId)).toEqual({
      number: 7,
      url: "https://github.com/octo/repo/issues/7",
    });
    expect(calls).toHaveLength(0);
  });

  test("500 returns null and leaves the row unlinked", async () => {
    const s = await setup();
    route({ postStatuses: [500] });
    expect(await GithubIssueService.createIssueForTask(s.taskId)).toBeNull();
    expect((await getTask(s.taskId)).githubIssueNumber).toBeNull();
  });

  test("a throwing fetch returns null", async () => {
    const s = await setup();
    responder = () => {
      throw new Error("network down");
    };
    expect(await GithubIssueService.createIssueForTask(s.taskId)).toBeNull();
  });
});

describe("syncTaskToGitHub", () => {
  async function linked(
    opts: Parameters<typeof setup>[0] = {},
  ): Promise<Setup> {
    const s = await setup(opts);
    await linkIssue(s.taskId);
    return s;
  }

  test("title only sends one PATCH with only title and no GET", async () => {
    const s = await linked();
    route();
    expect(
      await GithubIssueService.syncTaskToGitHub(s.taskId, { title: "New" }),
    ).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("PATCH");
    expect(calls[0].url).toBe(`${API}/issues/7`);
    expect(json(calls[0])).toEqual({ title: "New" });
  });

  test("null description sends empty body", async () => {
    const s = await linked();
    route();
    await GithubIssueService.syncTaskToGitHub(s.taskId, { description: null });
    expect(json(calls[0])).toEqual({ body: "" });
  });

  test("done closes as completed and merges labels", async () => {
    const s = await linked({ priority: "high" });
    route({ labels: ["bug", { name: "status:todo" }, "priority:low"] });
    expect(
      await GithubIssueService.syncTaskToGitHub(s.taskId, { status: "done" }),
    ).toBe(true);
    expect(calls.map((c) => c.method)).toEqual(["GET", "PATCH"]);
    expect(json(calls[1])).toEqual({
      state: "closed",
      state_reason: "completed",
      labels: ["bug", "priority:high", "status:done"],
    });
  });

  test("cancelled closes as not_planned", async () => {
    const s = await linked();
    route();
    await GithubIssueService.syncTaskToGitHub(s.taskId, {
      status: "cancelled",
    });
    const body = json(calls.find((c) => c.method === "PATCH")!);
    expect(body.state).toBe("closed");
    expect(body.state_reason).toBe("not_planned");
  });

  test("in_progress reopens", async () => {
    const s = await linked();
    route();
    await GithubIssueService.syncTaskToGitHub(s.taskId, {
      status: "in_progress",
    });
    const body = json(calls.find((c) => c.method === "PATCH")!);
    expect(body.state).toBe("open");
    expect(body.state_reason).toBe("reopened");
    expect(body.labels).toEqual(["priority:medium", "status:in-progress"]);
  });

  test("priority sends labels with stored status and no state", async () => {
    const s = await linked({ status: "in_progress" });
    route({ labels: ["bug"] });
    await GithubIssueService.syncTaskToGitHub(s.taskId, {
      priority: "urgent",
    });
    const body = json(calls.find((c) => c.method === "PATCH")!);
    expect(body).toEqual({
      labels: ["bug", "priority:urgent", "status:in-progress"],
    });
  });

  test("failed label GET is treated as no labels", async () => {
    const s = await linked();
    route({ labels: ["bug"], getStatus: 404 });
    await GithubIssueService.syncTaskToGitHub(s.taskId, { priority: "high" });
    const body = json(calls.find((c) => c.method === "PATCH")!);
    expect(body.labels).toEqual(["priority:high", "status:todo"]);
  });

  test("assignee id resolves to login, invited first", async () => {
    const assignee = await makeUser("999");
    const s = await linked();
    route();
    await GithubIssueService.syncTaskToGitHub(s.taskId, {
      assigneeId: assignee,
    });
    const patches = calls.filter((c) => c.method === "PATCH");
    expect(patches).toHaveLength(1);
    expect(json(patches[0])).toEqual({ assignees: ["alice"] });
    const put = calls.findIndex((c) => c.method === "PUT");
    expect(put).toBeGreaterThanOrEqual(0);
    expect(put).toBeLessThan(calls.findIndex((c) => c.method === "PATCH"));
  });

  test("null assignee sends empty assignees", async () => {
    const s = await linked();
    route();
    await GithubIssueService.syncTaskToGitHub(s.taskId, { assigneeId: null });
    expect(json(calls[0])).toEqual({ assignees: [] });
  });

  test("task without an issue creates one (POST, no PATCH)", async () => {
    const s = await setup();
    route();
    expect(
      await GithubIssueService.syncTaskToGitHub(s.taskId, { title: "X" }),
    ).toBe(true);
    expect(calls.map((c) => c.method)).toEqual(["POST"]);
  });

  test("empty updates return true without fetch", async () => {
    const s = await linked();
    expect(await GithubIssueService.syncTaskToGitHub(s.taskId, {})).toBe(true);
    expect(
      await GithubIssueService.syncTaskToGitHub(s.taskId, {
        title: undefined,
      }),
    ).toBe(true);
    expect(calls).toHaveLength(0);
  });

  test("non-linked task returns false without fetch", async () => {
    const s = await setup({ githubRepo: null });
    expect(
      await GithubIssueService.syncTaskToGitHub(s.taskId, { title: "A" }),
    ).toBe(false);
    expect(calls).toHaveLength(0);
  });

  test("no token returns false without fetch", async () => {
    const s = await setup({ connected: false });
    await linkIssue(s.taskId);
    expect(
      await GithubIssueService.syncTaskToGitHub(s.taskId, { title: "A" }),
    ).toBe(false);
    expect(calls).toHaveLength(0);
  });

  test("PATCH 500 returns false", async () => {
    const s = await linked();
    route({ patchStatus: 500 });
    expect(
      await GithubIssueService.syncTaskToGitHub(s.taskId, { title: "A" }),
    ).toBe(false);
  });

  test("a throwing fetch returns false", async () => {
    const s = await linked();
    responder = () => {
      throw new Error("boom");
    };
    expect(
      await GithubIssueService.syncTaskToGitHub(s.taskId, { title: "A" }),
    ).toBe(false);
  });
});

describe("acting user and unresolved assignee", () => {
  test("explicit userId's token is used instead of the creator's", async () => {
    const s = await setup();
    const other = await makeUser();
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "55",
      providerId: "github",
      userId: other,
      accessToken: "gho_other",
    });
    route();
    await GithubIssueService.createIssueForTask(s.taskId, other);
    const post = calls.find((c) => c.method === "POST")!;
    expect(post.headers.get("authorization")).toContain("gho_other");
    expect(post.headers.get("authorization")).not.toContain("gho_test");
  });

  test("an env token lets an unconnected creator create an issue", async () => {
    const s = await setup({ connected: false });
    process.env.GITHUB_TOKEN = "env_tok";
    route();
    const res = await GithubIssueService.createIssueForTask(s.taskId);
    expect(res?.number).toBe(42);
    expect(calls[0].headers.get("authorization")).toContain("env_tok");
  });

  test("an assignee whose login lookup fails sends no assignees on create", async () => {
    const assignee = await makeUser("999");
    const s = await setup({ assigneeId: assignee });
    route();
    const base = responder;
    responder = (r) =>
      r.url.startsWith("https://api.github.com/user/")
        ? new Response("nf", { status: 404 })
        : base(r);
    await GithubIssueService.createIssueForTask(s.taskId);
    expect(json(calls.find((c) => c.method === "POST")!).assignees).toBe(
      undefined,
    );
    expect(calls.some((c) => c.method === "PUT")).toBe(false);
  });

  test("an assignee without GitHub pushes empty assignees on sync", async () => {
    const assignee = await makeUser();
    const s = await setup();
    await linkIssue(s.taskId);
    route();
    await GithubIssueService.syncTaskToGitHub(s.taskId, {
      assigneeId: assignee,
    });
    expect(json(calls.find((c) => c.method === "PATCH")!)).toEqual({
      assignees: [],
    });
  });

  test("422 without assignees is not retried", async () => {
    const s = await setup();
    route({ postStatuses: [422, 201] });
    expect(await GithubIssueService.createIssueForTask(s.taskId)).toBeNull();
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(1);
  });
});

describe("combined and failure paths (QA)", () => {
  test("all fields at once go in one PATCH with pushed values winning", async () => {
    const assignee = await makeUser("999");
    const s = await setup({ priority: "medium" });
    await linkIssue(s.taskId);
    route({ labels: [{ name: "bug" }, { nameless: true }, "status:todo"] });
    expect(
      await GithubIssueService.syncTaskToGitHub(s.taskId, {
        title: "T2",
        description: "D2",
        status: "done",
        priority: "urgent",
        assigneeId: assignee,
      }),
    ).toBe(true);
    const patches = calls.filter((c) => c.method === "PATCH");
    expect(patches).toHaveLength(1);
    expect(json(patches[0])).toEqual({
      title: "T2",
      body: "D2",
      state: "closed",
      state_reason: "completed",
      labels: ["bug", "priority:urgent", "status:done"],
      assignees: ["alice"],
    });
  });

  test("a failed collaborator invite does not stop assignment", async () => {
    const assignee = await makeUser("999");
    const s = await setup({ assigneeId: assignee });
    route();
    const base = responder;
    responder = (r) =>
      r.method === "PUT" ? new Response("no", { status: 403 }) : base(r);
    const res = await GithubIssueService.createIssueForTask(s.taskId);
    expect(res?.number).toBe(42);
    expect(json(calls.find((c) => c.method === "POST")!).assignees).toEqual([
      "alice",
    ]);
  });

  test("a failing retry after 422 returns null and leaves the row unlinked", async () => {
    const assignee = await makeUser("999");
    const s = await setup({ assigneeId: assignee });
    route({ postStatuses: [422, 500] });
    expect(await GithubIssueService.createIssueForTask(s.taskId)).toBeNull();
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(2);
    expect((await getTask(s.taskId)).githubIssueNumber).toBeNull();
  });

  test("creating on behalf of a sync uses the explicit acting user's token", async () => {
    const s = await setup();
    const other = await makeUser();
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "55",
      providerId: "github",
      userId: other,
      accessToken: "gho_other",
    });
    route();
    expect(
      await GithubIssueService.syncTaskToGitHub(
        s.taskId,
        { title: "x" },
        other,
      ),
    ).toBe(true);
    expect(calls[0].headers.get("authorization")).toContain("gho_other");
  });
});
