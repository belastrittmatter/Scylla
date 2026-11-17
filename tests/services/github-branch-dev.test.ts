import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { account, project, task, user } from "../../src/db/schema";
import {
  GithubBranchError,
  type GithubBranchErrorCode,
  GithubBranchService,
} from "../../src/services/github/github-branch-service";
import { GithubDevService } from "../../src/services/github/github-dev-service";
import { TaskService } from "../../src/services/task/task-service";
import { TeamService } from "../../src/services/team/team-service";

interface Call {
  url: string;
  method: string;
  body: string | null;
}
type Handler = (url: string, method: string) => Response | undefined;

const API = "https://api.github.com/repos/octo/repo";
const userIds: string[] = [];
let calls: Call[] = [];
let handler: Handler = () => undefined;
let originalFetch: typeof fetch;
let savedEnv: Record<string, string | undefined> = {};

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  originalFetch = globalThis.fetch;
  calls = [];
  handler = () => undefined;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method ?? "GET";
    calls.push({
      url,
      method,
      body: typeof init?.body === "string" ? init.body : null,
    });
    return handler(url, method) ?? new Response("unexpected", { status: 500 });
  }) as typeof fetch;
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  savedEnv = {};
  for (const id of userIds.splice(0)) {
    await db.delete(user).where(eq(user.id, id));
  }
});

function withoutEnvTokens(): void {
  for (const k of ["GITHUB_TOKEN", "GITHUB_ACCESS_TOKEN"]) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
}

interface SetupOpts {
  repo?: string | null;
  withProject?: boolean;
  withToken?: boolean;
  title?: string;
  github?: Partial<typeof task.$inferInsert>;
}

async function setup(opts: SetupOpts = {}) {
  const { repo = "octo/repo", withProject = true, withToken = true } = opts;
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "N",
      email: `n-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  userIds.push(u.id);
  if (withToken) {
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
  const [proj] = withProject
    ? await db
        .insert(project)
        .values({
          name: "P",
          slug: `p-${crypto.randomUUID()}`,
          teamId: team.id,
          githubRepo: repo,
        })
        .returning()
    : [null];
  const created = await TaskService.createTask({
    title: opts.title ?? "Add GitHub sync",
    teamId: team.id,
    projectId: proj?.id,
    creatorId: u.id,
    status: "todo",
    priority: "medium",
  });
  if (opts.github) {
    await db.update(task).set(opts.github).where(eq(task.id, created.id));
  }
  return { u, taskId: created.id };
}

async function row(taskId: string) {
  const [r] = await db.select().from(task).where(eq(task.id, taskId));
  return r;
}

function refsHandler(opts: {
  repoStatus?: number;
  postStatus?: number;
  sha?: string | null;
}): Handler {
  return (url, method) => {
    if (url === API && method === "GET") {
      return opts.repoStatus && opts.repoStatus !== 200
        ? json({}, opts.repoStatus)
        : json({ default_branch: "develop" });
    }
    if (url === `${API}/git/ref/heads/develop`) {
      return json({
        object: opts.sha === null ? {} : { sha: opts.sha ?? "abc123" },
      });
    }
    if (url === `${API}/git/refs` && method === "POST") {
      return json({}, opts.postStatus ?? 201);
    }
    return undefined;
  };
}

describe("GithubBranchService.createBranchForTask", () => {
  test("creates the ref from the default branch head and stores the branch", async () => {
    const { taskId } = await setup({ github: { githubIssueNumber: 42 } });
    handler = refsHandler({ sha: "sha-1" });

    const result = await GithubBranchService.createBranchForTask(taskId);

    expect(result).toEqual({
      branchName: "feat/42-add-github-sync",
      alreadyExisted: false,
      checkoutCommand:
        "git fetch origin && git checkout feat/42-add-github-sync",
      issueNumber: 42,
    });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      `GET ${API}`,
      `GET ${API}/git/ref/heads/develop`,
      `POST ${API}/git/refs`,
    ]);
    expect(JSON.parse(calls[2].body ?? "{}")).toEqual({
      ref: "refs/heads/feat/42-add-github-sync",
      sha: "sha-1",
    });
    const r = await row(taskId);
    expect(r.githubBranch).toBe("feat/42-add-github-sync");
    expect(r.status).toBe("todo");
  });

  test("a task without an issue gets a branch without a number", async () => {
    const { taskId } = await setup();
    handler = refsHandler({});
    const result = await GithubBranchService.createBranchForTask(taskId);
    expect(result.branchName).toBe("feat/add-github-sync");
    expect(result.issueNumber).toBeNull();
  });

  test("a custom name is trimmed; a 422 means it already existed", async () => {
    const { taskId } = await setup();
    handler = refsHandler({ postStatus: 422 });
    const result = await GithubBranchService.createBranchForTask(
      taskId,
      "  fix/login-bug ",
    );
    expect(result.branchName).toBe("fix/login-bug");
    expect(result.alreadyExisted).toBe(true);
    expect((await row(taskId)).githubBranch).toBe("fix/login-bug");
  });

  test("an existing stored branch is reused", async () => {
    const { taskId } = await setup({ github: { githubBranch: "feat/kept" } });
    handler = refsHandler({});
    const result = await GithubBranchService.createBranchForTask(taskId);
    expect(result.branchName).toBe("feat/kept");
  });

  async function expectCode(
    p: Promise<unknown>,
    code: GithubBranchErrorCode,
    message?: string,
  ): Promise<void> {
    const err = await p.then(
      () => null,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(GithubBranchError);
    expect((err as GithubBranchError).code).toBe(code);
    expect((err as GithubBranchError).name).toBe("GithubBranchError");
    if (message) expect((err as Error).message).toBe(message);
  }

  test("unknown task", async () => {
    const id = crypto.randomUUID();
    await expectCode(
      GithubBranchService.createBranchForTask(id),
      "task_not_found",
      `Task "${id}" not found`,
    );
    expect(calls).toHaveLength(0);
  });

  test("project without a repository", async () => {
    const { taskId } = await setup({ repo: null });
    await expectCode(
      GithubBranchService.createBranchForTask(taskId),
      "not_linked",
      "Task's project is not linked to a GitHub repository",
    );
    expect(calls).toHaveLength(0);
  });

  test("task without a project", async () => {
    const { taskId } = await setup({ withProject: false });
    await expectCode(
      GithubBranchService.createBranchForTask(taskId),
      "not_linked",
    );
  });

  test("no token", async () => {
    withoutEnvTokens();
    const { taskId } = await setup({ withToken: false });
    await expectCode(
      GithubBranchService.createBranchForTask(taskId),
      "no_token",
      "No GitHub access token found. Connect your GitHub account in Account Settings.",
    );
    expect(calls).toHaveLength(0);
  });

  test("invalid custom branch name", async () => {
    const { taskId } = await setup();
    await expectCode(
      GithubBranchService.createBranchForTask(taskId, "feat/x; rm -rf /"),
      "invalid_branch_name",
      'Invalid branch name "feat/x; rm -rf /"',
    );
    expect(calls).toHaveLength(0);
  });

  test("a 404 on the repository request is a github_error", async () => {
    const { taskId } = await setup();
    handler = refsHandler({ repoStatus: 404 });
    await expectCode(
      GithubBranchService.createBranchForTask(taskId),
      "github_error",
    );
    expect((await row(taskId)).githubBranch).toBeNull();
  });

  test("a missing sha is a github_error", async () => {
    const { taskId } = await setup();
    handler = refsHandler({ sha: null });
    await expectCode(
      GithubBranchService.createBranchForTask(taskId),
      "github_error",
    );
  });

  test("a 500 on the POST is a github_error and stores nothing", async () => {
    const { taskId } = await setup();
    handler = refsHandler({ postStatus: 500 });
    await expectCode(
      GithubBranchService.createBranchForTask(taskId),
      "github_error",
    );
    expect((await row(taskId)).githubBranch).toBeNull();
  });
});

const prItem = (over: Record<string, unknown> = {}) => ({
  number: 7,
  head: { ref: "feat/42-x" },
  state: "open",
  draft: false,
  merged_at: null,
  html_url: "https://github.com/octo/repo/pull/7",
  title: "My PR",
  ...over,
});

function devHandler(opts: {
  branchOk?: boolean;
  pulls?: unknown[] | number;
  timeline?: unknown[] | number;
}): Handler {
  return (url) => {
    if (url.startsWith(`${API}/branches/`)) {
      return json({}, opts.branchOk ? 200 : 404);
    }
    if (url.startsWith(`${API}/pulls?`)) {
      return typeof opts.pulls === "number"
        ? json({}, opts.pulls)
        : json(opts.pulls ?? []);
    }
    if (url.includes("/timeline")) {
      return typeof opts.timeline === "number"
        ? json({}, opts.timeline)
        : json(opts.timeline ?? []);
    }
    return undefined;
  };
}

const crossRef = (title: string, extra: Record<string, unknown> = {}) => ({
  event: "cross-referenced",
  source: {
    issue: {
      number: 9,
      title,
      body: "",
      state: "open",
      html_url: "https://github.com/octo/repo/pull/9",
      pull_request: { merged_at: null },
      ...extra,
    },
  },
});

describe("GithubDevService.getTaskDevelopmentInfo", () => {
  test("unknown task rejects", async () => {
    const id = crypto.randomUUID();
    await expect(GithubDevService.getTaskDevelopmentInfo(id)).rejects.toThrow(
      `Task "${id}" not found`,
    );
  });

  test("not linked project makes no request", async () => {
    const { taskId } = await setup({ repo: null });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(calls).toHaveLength(0);
    expect(info.repository).toBeNull();
    expect(info.isBranchOnRemote).toBe(false);
    expect(info.pullRequest).toBeNull();
    expect(info.suggestedBranch).toBe("feat/add-github-sync");
    expect(info.checkoutCommand).toBe("git checkout -b feat/add-github-sync");
  });

  test("links the PR whose head is the task branch", async () => {
    const { taskId } = await setup({
      github: { githubBranch: "feat/42-x", githubIssueNumber: 42 },
    });
    handler = devHandler({ branchOk: true, pulls: [prItem()] });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(info.repository).toBe("octo/repo");
    expect(info.isBranchOnRemote).toBe(true);
    expect(info.checkoutCommand).toBe(
      "git fetch origin && git checkout feat/42-x",
    );
    expect(info.pullRequest).toEqual({
      number: 7,
      url: "https://github.com/octo/repo/pull/7",
      title: "My PR",
      state: "open",
    });
    expect(calls[0].url).toBe(`${API}/branches/feat%2F42-x`);
    expect(calls[1].url).toBe(`${API}/pulls?head=octo:feat%2F42-x&state=all`);
    const r = await row(taskId);
    expect(r.githubPrNumber).toBe(7);
    expect(r.githubPrStatus).toBe("open");
    expect(r.githubPrUrl).toBe("https://github.com/octo/repo/pull/7");
  });

  test("ignores a PR from a different branch", async () => {
    const { taskId } = await setup({ github: { githubBranch: "feat/42-x" } });
    handler = devHandler({
      branchOk: true,
      pulls: [prItem({ head: { ref: "feat/other" } })],
    });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(info.pullRequest).toBeNull();
    expect((await row(taskId)).githubPrNumber).toBeNull();
  });

  test("timeline: closing keyword PR is linked, state merged", async () => {
    const { taskId } = await setup({ github: { githubIssueNumber: 42 } });
    handler = devHandler({
      timeline: [
        crossRef("Fixes #42", { pull_request: { merged_at: "2026-01-01" } }),
      ],
    });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(info.pullRequest).toEqual({
      number: 9,
      url: "https://github.com/octo/repo/pull/9",
      title: "Fixes #42",
      state: "merged",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${API}/issues/42/timeline?per_page=100`);
    expect((await row(taskId)).githubPrStatus).toBe("merged");
  });

  test("timeline: a PR that only mentions the issue is not linked", async () => {
    const { taskId } = await setup({ github: { githubIssueNumber: 42 } });
    handler = devHandler({ timeline: [crossRef("related to #42")] });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(info.pullRequest).toBeNull();
  });

  test("timeline: a plain issue is not linked", async () => {
    const { taskId } = await setup({ github: { githubIssueNumber: 42 } });
    handler = devHandler({
      timeline: [crossRef("Fixes #42", { pull_request: undefined })],
    });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(info.pullRequest).toBeNull();
  });

  test("detaches a stored PR when lookups succeed without a match", async () => {
    const { taskId } = await setup({
      github: {
        githubIssueNumber: 42,
        githubBranch: "feat/42-x",
        githubPrNumber: 9,
        githubPrUrl: "https://github.com/octo/repo/pull/9",
        githubPrStatus: "open",
      },
    });
    handler = devHandler({ branchOk: true, pulls: [], timeline: [] });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(info.pullRequest).toBeNull();
    const r = await row(taskId);
    expect(r.githubPrNumber).toBeNull();
    expect(r.githubPrUrl).toBeNull();
    expect(r.githubPrStatus).toBeNull();
  });

  test("a failing pulls request keeps the stored PR", async () => {
    const { taskId } = await setup({
      github: {
        githubBranch: "feat/42-x",
        githubPrNumber: 9,
        githubPrUrl: "https://github.com/octo/repo/pull/9",
        githubPrStatus: "merged",
      },
    });
    handler = devHandler({ branchOk: true, pulls: 500 });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(info.pullRequest).toEqual({
      number: 9,
      url: "https://github.com/octo/repo/pull/9",
      title: "",
      state: "merged",
    });
    expect((await row(taskId)).githubPrNumber).toBe(9);
  });

  test("a thrown fetch never throws and keeps the stored PR", async () => {
    const { taskId } = await setup({
      github: { githubBranch: "feat/42-x", githubPrNumber: 9 },
    });
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(info.pullRequest?.number).toBe(9);
    expect((await row(taskId)).githubPrNumber).toBe(9);
  });

  test("no token: no request, stored PR returned with an empty title", async () => {
    withoutEnvTokens();
    const { taskId } = await setup({
      withToken: false,
      github: {
        githubBranch: "feat/42-x",
        githubPrNumber: 9,
        githubPrUrl: "https://github.com/octo/repo/pull/9",
        githubPrStatus: "weird",
      },
    });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(calls).toHaveLength(0);
    expect(info.isBranchOnRemote).toBe(false);
    expect(info.pullRequest).toEqual({
      number: 9,
      url: "https://github.com/octo/repo/pull/9",
      title: "",
      state: "open",
    });
  });

  test("branch PR found: the timeline is not requested", async () => {
    const { taskId } = await setup({
      github: { githubBranch: "feat/42-x", githubIssueNumber: 42 },
    });
    handler = devHandler({
      branchOk: true,
      pulls: [prItem({ merged_at: "2026-01-01", state: "closed" })],
      timeline: [crossRef("Fixes #42")],
    });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(info.pullRequest?.number).toBe(7);
    expect(info.pullRequest?.state).toBe("merged");
    expect(calls.some((c) => c.url.includes("/timeline"))).toBe(false);
  });

  test("no branch PR: falls back to the timeline with the branch checked", async () => {
    const { taskId } = await setup({
      github: { githubBranch: "feat/42-x", githubIssueNumber: 42 },
    });
    handler = devHandler({
      branchOk: false,
      pulls: [],
      timeline: [crossRef("related to #42"), crossRef("Closes #42")],
    });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(info.isBranchOnRemote).toBe(false);
    expect(info.checkoutCommand).toBe("git checkout -b feat/42-x");
    expect(info.pullRequest?.title).toBe("Closes #42");
    expect((await row(taskId)).githubPrNumber).toBe(9);
  });

  test("a failing timeline keeps the stored PR", async () => {
    const { taskId } = await setup({
      github: {
        githubBranch: "feat/42-x",
        githubIssueNumber: 42,
        githubPrNumber: 9,
        githubPrUrl: "u",
        githubPrStatus: "closed",
      },
    });
    handler = devHandler({ branchOk: true, pulls: [], timeline: 500 });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(info.pullRequest?.state).toBe("closed");
    expect((await row(taskId)).githubPrNumber).toBe(9);
  });

  test("linked task with no branch and no issue makes no request", async () => {
    const { taskId } = await setup({
      github: { githubPrNumber: 9, githubPrUrl: "u", githubPrStatus: "draft" },
    });
    const info = await GithubDevService.getTaskDevelopmentInfo(taskId);
    expect(calls).toHaveLength(0);
    expect(info.pullRequest?.state).toBe("draft");
    expect((await row(taskId)).githubPrNumber).toBe(9);
  });

  test("the default branch falls back to main", async () => {
    const { taskId } = await setup();
    handler = (url, method) => {
      if (url === API) return json({});
      if (url === `${API}/git/ref/heads/main`)
        return json({ object: { sha: "s" } });
      if (url === `${API}/git/refs` && method === "POST") return json({}, 201);
      return undefined;
    };
    const result = await GithubBranchService.createBranchForTask(taskId);
    expect(result.alreadyExisted).toBe(false);
    expect(calls[1].url).toBe(`${API}/git/ref/heads/main`);
  });

  test("an explicit userId without a token fails with no_token", async () => {
    withoutEnvTokens();
    const { taskId } = await setup();
    const other = await setup({ withToken: false });
    const err = await GithubBranchService.createBranchForTask(
      taskId,
      undefined,
      other.u.id,
    ).then(
      () => null,
      (e: unknown) => e,
    );
    expect((err as GithubBranchError).code).toBe("no_token");
    expect(calls).toHaveLength(0);
  });
});
