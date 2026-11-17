import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account, task, teamMember, user } from "@/db/schema";
import { GithubApiError } from "@/services/github/github-errors";
import { GithubIntegrationService as Gh } from "@/services/github/github-integration-service";
import {
  createGithubFixture,
  insertTask,
  type GithubFixture,
} from "../test-utils/github-fixtures";
import {
  mockGithubApi,
  type GithubMockRoute,
} from "../test-utils/mock-github-api";

const ENV_KEYS = ["GITHUB_TOKEN", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"];
const savedEnv: Record<string, string | undefined> = {};
let fixture: GithubFixture;
let restore: (() => void) | null = null;
const R = "/repos/acme/widgets";

beforeEach(async () => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  fixture = await createGithubFixture();
});

afterEach(async () => {
  restore?.();
  restore = null;
  await fixture.cleanup();
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

function mock(routes: GithubMockRoute[]) {
  const m = mockGithubApi(routes);
  restore = m.restore;
  return m;
}

async function mkTask(values: Partial<typeof task.$inferInsert> = {}) {
  return insertTask({
    teamId: fixture.teamId,
    projectId: fixture.projectId,
    creatorId: fixture.userId,
    ...values,
  });
}

async function reload(id: string) {
  const [row] = await db.select().from(task).where(eq(task.id, id));
  return row;
}

describe("createIssueForTask", () => {
  test("POSTs the issue and stores number, url and repo", async () => {
    const t = await mkTask({ title: "Do it", description: "details" });
    const m = mock([
      {
        method: "POST",
        path: `${R}/issues`,
        status: 201,
        body: {
          number: 42,
          html_url: "https://github.com/acme/widgets/issues/42",
        },
      },
    ]);
    const res = await Gh.createIssueForTask(t.id, fixture.userId);
    expect(res).toEqual({
      number: 42,
      url: "https://github.com/acme/widgets/issues/42",
    });
    expect(m.calls).toHaveLength(1);
    expect(m.calls[0].body).toEqual({
      title: "Do it",
      body: "details",
      labels: ["status: todo", "priority: medium"],
    });
    const row = await reload(t.id);
    expect(row.githubIssueNumber).toBe(42);
    expect(row.githubIssueUrl).toBe(
      "https://github.com/acme/widgets/issues/42",
    );
    expect(row.githubRepo).toBe("acme/widgets");
  });

  test("a done task is also closed", async () => {
    const t = await mkTask({ status: "done" });
    const m = mock([
      {
        method: "POST",
        path: `${R}/issues`,
        status: 201,
        body: { number: 7, html_url: "u" },
      },
      { method: "PATCH", path: `${R}/issues/7` },
    ]);
    await Gh.createIssueForTask(t.id, fixture.userId);
    expect(m.calls[1].method).toBe("PATCH");
    expect(m.calls[1].body).toEqual({
      state: "closed",
      state_reason: "completed",
    });
  });

  test("null without calls for unlinked, missing and already linked tasks", async () => {
    const m = mock([]);
    const other = await createGithubFixture({ repo: null });
    const unlinked = await insertTask({
      teamId: other.teamId,
      projectId: other.projectId,
      creatorId: other.userId,
    });
    expect(await Gh.createIssueForTask(unlinked.id, other.userId)).toBeNull();
    await other.cleanup();
    expect(await Gh.createIssueForTask("missing")).toBeNull();
    const linked = await mkTask({ githubIssueNumber: 9 });
    expect(await Gh.createIssueForTask(linked.id)).toEqual({
      number: 9,
      url: "https://github.com/acme/widgets/issues/9",
    });
    expect(m.calls).toHaveLength(0);
  });

  test("null on a 500", async () => {
    const t = await mkTask();
    mock([{ method: "POST", path: `${R}/issues`, status: 500 }]);
    expect(await Gh.createIssueForTask(t.id, fixture.userId)).toBeNull();
    expect((await reload(t.id)).githubIssueNumber).toBeNull();
  });
});

describe("syncTaskToGitHub", () => {
  test("title and null description", async () => {
    const t = await mkTask({ githubIssueNumber: 3 });
    const m = mock([{ method: "PATCH", path: `${R}/issues/3` }]);
    expect(
      await Gh.syncTaskToGitHub(t.id, { title: "New", description: null }),
    ).toBe(true);
    expect(m.calls).toHaveLength(1);
    expect(m.calls[0].body).toEqual({ title: "New", body: "" });
  });

  test("status merges labels and opens the issue", async () => {
    const t = await mkTask({ githubIssueNumber: 3 });
    const m = mock([
      {
        method: "GET",
        path: `${R}/issues/3`,
        body: { labels: [{ name: "bug" }, { name: "status: todo" }] },
      },
      { method: "PATCH", path: `${R}/issues/3` },
    ]);
    await Gh.syncTaskToGitHub(t.id, { status: "in_review" }, fixture.userId);
    expect(m.calls.map((c) => c.method)).toEqual(["GET", "PATCH"]);
    expect(m.calls[1].body).toEqual({
      state: "open",
      labels: ["bug", "status: in review"],
    });
  });

  test("cancelled sends closed and not_planned", async () => {
    const t = await mkTask({ githubIssueNumber: 3 });
    const m = mock([
      { method: "GET", path: `${R}/issues/3`, body: { labels: [] } },
      { method: "PATCH", path: `${R}/issues/3` },
    ]);
    await Gh.syncTaskToGitHub(t.id, { status: "cancelled" });
    expect(m.calls[1].body).toMatchObject({
      state: "closed",
      state_reason: "not_planned",
    });
  });

  test("priority only sends labels without state", async () => {
    const t = await mkTask({ githubIssueNumber: 3 });
    const m = mock([
      {
        method: "GET",
        path: `${R}/issues/3`,
        body: { labels: ["priority: low", "x"] },
      },
      { method: "PATCH", path: `${R}/issues/3` },
    ]);
    await Gh.syncTaskToGitHub(t.id, { priority: "urgent" });
    expect(m.calls[1].body).toEqual({ labels: ["x", "priority: urgent"] });
  });

  test("false without calls", async () => {
    const t = await mkTask({ githubIssueNumber: 3 });
    const noIssue = await mkTask();
    const m = mock([]);
    expect(await Gh.syncTaskToGitHub(t.id, {})).toBe(false);
    expect(await Gh.syncTaskToGitHub(t.id, { title: undefined })).toBe(false);
    expect(await Gh.syncTaskToGitHub(noIssue.id, { title: "x" })).toBe(false);
    expect(await Gh.syncTaskToGitHub("missing", { title: "x" })).toBe(false);
    expect(m.calls).toHaveLength(0);
  });

  test("false on an error response", async () => {
    const t = await mkTask({ githubIssueNumber: 3 });
    mock([{ method: "PATCH", path: `${R}/issues/3`, status: 422 }]);
    expect(await Gh.syncTaskToGitHub(t.id, { title: "x" })).toBe(false);
  });
});

describe("createBranchForTask", () => {
  const routes = (refStatus: number): GithubMockRoute[] => [
    { method: "GET", path: R, body: { default_branch: "main" } },
    {
      method: "GET",
      path: `${R}/git/ref/heads/main`,
      body: { object: { sha: "abc123" } },
    },
    { method: "POST", path: `${R}/git/refs`, status: refStatus },
  ];

  test("creates the branch in three calls and stores it", async () => {
    const t = await mkTask({ title: "Add sync", githubIssueNumber: 12 });
    const m = mock(routes(201));
    const res = await Gh.createBranchForTask(t.id, fixture.userId);
    expect(m.calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      `GET ${R}`,
      `GET ${R}/git/ref/heads/main`,
      `POST ${R}/git/refs`,
    ]);
    expect(m.calls[2].body).toEqual({
      ref: "refs/heads/feat/12-add-sync",
      sha: "abc123",
    });
    expect(res).toEqual({
      branch: "feat/12-add-sync",
      alreadyExisted: false,
      checkoutCommand: "git fetch origin && git checkout feat/12-add-sync",
      url: "https://github.com/acme/widgets/tree/feat/12-add-sync",
    });
    expect((await reload(t.id)).githubBranch).toBe("feat/12-add-sync");
  });

  test("422 means the branch already existed; custom name is used", async () => {
    const t = await mkTask();
    mock(routes(422));
    const res = await Gh.createBranchForTask(t.id, undefined, " fix/custom ");
    expect(res.alreadyExisted).toBe(true);
    expect(res.branch).toBe("fix/custom");
  });

  test("other failures throw GithubApiError", async () => {
    const t = await mkTask();
    mock([{ method: "GET", path: R, status: 403 }]);
    const err = await Gh.createBranchForTask(t.id).catch((e) => e);
    expect(err).toBeInstanceOf(GithubApiError);
    expect(err.status).toBe(403);
  });

  test("errors for missing, unlinked and invalid", async () => {
    const m = mock([]);
    await expect(Gh.createBranchForTask("missing")).rejects.toThrow(
      "Task not found",
    );
    const other = await createGithubFixture({ repo: null });
    const t = await insertTask({
      teamId: other.teamId,
      projectId: other.projectId,
      creatorId: other.userId,
    });
    await expect(Gh.createBranchForTask(t.id)).rejects.toThrow(
      "Task is not linked to a GitHub repository",
    );
    await other.cleanup();
    const linked = await mkTask();
    await expect(
      Gh.createBranchForTask(linked.id, undefined, "bad..name"),
    ).rejects.toThrow("Invalid branch name");
    expect(m.calls).toHaveLength(0);
  });
});

describe("refreshTaskPullRequest", () => {
  const pull = (n: number, ref: string, extra = {}) => ({
    number: n,
    html_url: `https://github.com/acme/widgets/pull/${n}`,
    title: `PR ${n}`,
    state: "open",
    head: { ref },
    ...extra,
  });
  const base = (
    pulls: unknown[],
    timeline: unknown[] = [],
  ): GithubMockRoute[] => [
    { method: "GET", path: `${R}/pulls`, body: pulls },
    { method: "GET", path: `${R}/issues/5/timeline`, body: timeline },
  ];
  const xref = (n: number, repo = "acme/widgets") => ({
    event: "cross-referenced",
    source: {
      issue: { number: n, pull_request: {}, repository: { full_name: repo } },
    },
  });

  test("links by branch and writes columns", async () => {
    const t = await mkTask({ githubIssueNumber: 5, githubBranch: "feat/5-x" });
    const m = mock(base([pull(8, "feat/5-x", { draft: true }), pull(9, "o")]));
    const res = await Gh.refreshTaskPullRequest(t.id, fixture.userId);
    expect(res?.number).toBe(8);
    expect(m.calls[0].search).toBe("?state=all&per_page=100");
    const row = await reload(t.id);
    expect(row.githubPrNumber).toBe(8);
    expect(row.githubPrUrl).toBe("https://github.com/acme/widgets/pull/8");
    expect(row.githubPrStatus).toBe("draft");
  });

  test("links by cross-referenced timeline and adopts the head branch", async () => {
    const t = await mkTask({ githubIssueNumber: 5 });
    mock(base([pull(11, "feat/other"), pull(12, "z")], [xref(11)]));
    const res = await Gh.refreshTaskPullRequest(t.id);
    expect(res?.number).toBe(11);
    expect((await reload(t.id)).githubBranch).toBe("feat/other");
  });

  test("does not link mentions or foreign-repo timeline events", async () => {
    const t = await mkTask({ githubIssueNumber: 5 });
    mock(
      base(
        [
          pull(11, "a", { body: "fixes #5", title: "Merge pull request #5" }),
          pull(12, "b"),
        ],
        [xref(12, "other/repo")],
      ),
    );
    expect(await Gh.refreshTaskPullRequest(t.id)).toBeNull();
    const row = await reload(t.id);
    expect(row.githubPrNumber).toBeNull();
    expect(row.githubBranch).toBeNull();
  });

  test("a failed timeline counts as no events; unchanged columns on no match", async () => {
    const t = await mkTask({
      githubIssueNumber: 5,
      githubPrNumber: 1,
      githubPrStatus: "open",
    });
    mock([
      { method: "GET", path: `${R}/pulls`, body: [pull(11, "a")] },
      { method: "GET", path: `${R}/issues/5/timeline`, status: 500 },
    ]);
    expect(await Gh.refreshTaskPullRequest(t.id)).toBeNull();
    expect((await reload(t.id)).githubPrNumber).toBe(1);
  });

  test("no requests without issue or branch; null on GitHub errors", async () => {
    const t = await mkTask();
    const m = mock([{ method: "GET", path: `${R}/pulls`, status: 500 }]);
    expect(await Gh.refreshTaskPullRequest(t.id)).toBeNull();
    expect(m.calls).toHaveLength(0);
    const b = await mkTask({ githubBranch: "feat/x" });
    expect(await Gh.refreshTaskPullRequest(b.id)).toBeNull();
    expect(m.calls).toHaveLength(1);
  });
});

describe("getTaskDevelopmentInfo", () => {
  test("null for a missing task", async () => {
    expect(await Gh.getTaskDevelopmentInfo("missing")).toBeNull();
  });

  test("returns task data with a refreshed pull request", async () => {
    const t = await mkTask({
      title: "Add sync",
      githubIssueNumber: 5,
      githubIssueUrl: "https://github.com/acme/widgets/issues/5",
      githubBranch: "feat/5-add-sync",
    });
    mock([
      {
        method: "GET",
        path: `${R}/pulls`,
        body: [
          {
            number: 8,
            html_url: "u8",
            title: "T",
            state: "closed",
            merged_at: "2024-01-01",
            head: { ref: "feat/5-add-sync" },
          },
        ],
      },
      { method: "GET", path: `${R}/issues/5/timeline`, body: [] },
    ]);
    expect(await Gh.getTaskDevelopmentInfo(t.id)).toEqual({
      repository: "acme/widgets",
      issueNumber: 5,
      issueUrl: "https://github.com/acme/widgets/issues/5",
      branch: "feat/5-add-sync",
      suggestedBranch: "feat/5-add-sync",
      checkoutCommand: "git fetch origin && git checkout feat/5-add-sync",
      pullRequest: {
        number: 8,
        url: "u8",
        title: "T",
        state: "merged",
        headRef: "feat/5-add-sync",
      },
    });
  });

  test("falls back to the stored pull request, and handles unlinked tasks", async () => {
    const t = await mkTask({
      githubIssueNumber: 5,
      githubBranch: "b",
      githubPrNumber: 3,
      githubPrUrl: "u3",
      githubPrStatus: "closed",
    });
    mock([]);
    const info = await Gh.getTaskDevelopmentInfo(t.id);
    expect(info?.pullRequest).toEqual({
      number: 3,
      url: "u3",
      title: "",
      state: "closed",
      headRef: "b",
    });
    const other = await createGithubFixture({ repo: null });
    const u = await insertTask({
      teamId: other.teamId,
      projectId: other.projectId,
      creatorId: other.userId,
      title: "Plain",
    });
    expect(await Gh.getTaskDevelopmentInfo(u.id)).toEqual({
      repository: null,
      issueNumber: null,
      issueUrl: null,
      branch: null,
      suggestedBranch: "feat/plain",
      checkoutCommand: null,
      pullRequest: null,
    });
    await other.cleanup();
  });
});

describe("comments", () => {
  test("listIssueComments maps fields", async () => {
    const t = await mkTask({ githubIssueNumber: 5 });
    const m = mock([
      {
        method: "GET",
        path: `${R}/issues/5/comments`,
        body: [
          {
            id: 77,
            body: "hi",
            html_url: "h",
            created_at: "c",
            updated_at: "u",
            user: { login: "bob", avatar_url: "av" },
          },
          {
            id: 78,
            body: "x",
            html_url: "h2",
            created_at: "c",
            updated_at: "u",
          },
        ],
      },
    ]);
    const res = await Gh.listIssueComments(t.id, fixture.userId);
    expect(m.calls[0].search).toBe("?per_page=100");
    expect(res).toEqual([
      {
        id: "77",
        body: "hi",
        htmlUrl: "h",
        createdAt: "c",
        updatedAt: "u",
        author: { login: "bob", avatarUrl: "av" },
      },
      {
        id: "78",
        body: "x",
        htmlUrl: "h2",
        createdAt: "c",
        updatedAt: "u",
        author: { login: "ghost", avatarUrl: null },
      },
    ]);
  });

  test("createIssueComment returns a string id; null when unlinked or failing", async () => {
    const t = await mkTask({ githubIssueNumber: 5 });
    const noIssue = await mkTask();
    const m = mock([
      {
        method: "POST",
        path: `${R}/issues/5/comments`,
        status: 201,
        body: { id: 99, html_url: "hh" },
      },
    ]);
    expect(await Gh.createIssueComment(t.id, "hello")).toEqual({
      id: "99",
      htmlUrl: "hh",
    });
    expect(m.calls[0].body).toEqual({ body: "hello" });
    expect(await Gh.createIssueComment(noIssue.id, "x")).toBeNull();
    expect(await Gh.listIssueComments(noIssue.id)).toEqual([]);
    expect(m.calls).toHaveLength(1);
    m.restore();
    mock([{ method: "POST", path: `${R}/issues/5/comments`, status: 500 }]);
    expect(await Gh.createIssueComment(t.id, "x")).toBeNull();
  });
});

describe("collaborators", () => {
  test("inviteCollaborator sends push permission", async () => {
    const m = mock([
      { method: "PUT", path: `${R}/collaborators/octocat`, status: 201 },
      { method: "PUT", path: `${R}/collaborators/nope`, status: 404 },
    ]);
    expect(await Gh.inviteCollaborator("acme/widgets", "octocat")).toBe(true);
    expect(m.calls[0].body).toEqual({ permission: "push" });
    expect(await Gh.inviteCollaborator("acme/widgets", "nope")).toBe(false);
    expect(await Gh.inviteCollaborator("bad", "octocat")).toBe(false);
    expect(m.calls).toHaveLength(2);
  });

  test("inviteCollaborator is true on 204", async () => {
    mock([{ method: "PUT", path: `${R}/collaborators/o`, status: 204 }]);
    expect(await Gh.inviteCollaborator("acme/widgets", "o")).toBe(true);
  });

  test("inviteTeamCollaborators invites and skips", async () => {
    const withLogin = crypto.randomUUID();
    const noAccount = crypto.randomUUID();
    for (const id of [withLogin, noAccount]) {
      await db
        .insert(user)
        .values({ id, name: id, email: `${id}@example.com` });
      await db
        .insert(teamMember)
        .values({ teamId: fixture.teamId, userId: id, role: "member" });
    }
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "octocat",
      providerId: "github",
      userId: withLogin,
      updatedAt: new Date(),
    });
    // createTeam already gave the owner a member row (deduplicated).
    const m = mock([
      { method: "PUT", path: `${R}/collaborators/octocat`, status: 201 },
    ]);
    const res = await Gh.inviteTeamCollaborators(
      fixture.teamId,
      "acme/widgets",
      fixture.userId,
    );
    expect(res).toEqual({ invited: [withLogin], skipped: [noAccount] });
    expect(m.calls).toHaveLength(1);

    // the owner is covered when someone else acts
    const res2 = await Gh.inviteTeamCollaborators(
      fixture.teamId,
      "acme/widgets",
      withLogin,
    );
    expect(res2.invited).toEqual([]);
    expect(res2.skipped.sort()).toEqual([fixture.userId, noAccount].sort());
    await db.delete(user).where(eq(user.id, withLogin));
    await db.delete(user).where(eq(user.id, noAccount));
  });
});

describe("repository resolution and network errors (QA)", () => {
  test("a task's own githubRepo wins over the project's repository", async () => {
    const t = await mkTask({ githubRepo: "other/place" });
    const m = mock([
      {
        method: "POST",
        path: "/repos/other/place/issues",
        status: 201,
        body: {
          number: 3,
          html_url: "https://github.com/other/place/issues/3",
        },
      },
    ]);
    const res = await Gh.createIssueForTask(t.id, fixture.userId);
    expect(res?.number).toBe(3);
    expect(m.calls.map((c) => c.path)).toEqual(["/repos/other/place/issues"]);
    expect((await reload(t.id)).githubRepo).toBe("other/place");
  });

  test("a task without a project but with githubRepo is linked", async () => {
    const t = await mkTask({ projectId: null, githubRepo: "other/place" });
    const m = mock([{ method: "PATCH", path: "/repos/other/place/issues/4" }]);
    await db
      .update(task)
      .set({ githubIssueNumber: 4 })
      .where(eq(task.id, t.id));
    expect(await Gh.syncTaskToGitHub(t.id, { title: "x" })).toBe(true);
    expect(m.calls[0].path).toBe("/repos/other/place/issues/4");
  });

  test("network errors give null or false instead of throwing", async () => {
    const boom = () => {
      throw new Error("network down");
    };
    const t = await mkTask();
    mock([{ method: "POST", path: `${R}/issues`, body: boom }]);
    expect(await Gh.createIssueForTask(t.id, fixture.userId)).toBeNull();
    const s = await mkTask({ githubIssueNumber: 8 });
    restore?.();
    mock([{ method: "PATCH", path: `${R}/issues/8`, body: boom }]);
    expect(await Gh.syncTaskToGitHub(s.id, { title: "x" })).toBe(false);
  });

  test("createBranchForTask reuses the stored task branch", async () => {
    const t = await mkTask({ title: "Ignored", githubBranch: "feat/stored" });
    const m = mock([
      { method: "GET", path: R, body: { default_branch: "dev" } },
      {
        method: "GET",
        path: `${R}/git/ref/heads/dev`,
        body: { object: { sha: "s1" } },
      },
      { method: "POST", path: `${R}/git/refs`, status: 201 },
    ]);
    const res = await Gh.createBranchForTask(t.id);
    expect(res.branch).toBe("feat/stored");
    expect(m.calls[2].body).toEqual({
      ref: "refs/heads/feat/stored",
      sha: "s1",
    });
  });

  test("a PR found by timeline keeps the task's existing branch", async () => {
    const t = await mkTask({ githubIssueNumber: 5, githubBranch: "feat/mine" });
    mock([
      {
        method: "GET",
        path: `${R}/pulls`,
        body: [
          {
            number: 11,
            html_url: "u",
            state: "open",
            head: { ref: "feat/theirs" },
          },
        ],
      },
      {
        method: "GET",
        path: `${R}/issues/5/timeline`,
        body: [
          {
            event: "cross-referenced",
            source: { issue: { number: 11, pull_request: {} } },
          },
        ],
      },
    ]);
    expect((await Gh.refreshTaskPullRequest(t.id))?.number).toBe(11);
    const row = await reload(t.id);
    expect(row.githubPrNumber).toBe(11);
    expect(row.githubBranch).toBe("feat/mine");
  });
});
