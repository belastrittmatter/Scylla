import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { task } from "@/db/schema";
import { GithubApiError } from "@/services/github/github-errors";
import {
  BACKGROUND_SYNC_MIN_INTERVAL_MS,
  GithubSyncService,
} from "@/services/github/github-sync-service";
import {
  createGithubFixture,
  insertTask,
  type GithubFixture,
} from "../test-utils/github-fixtures";
import {
  mockGithubApi,
  type GithubMockRoute,
} from "../test-utils/mock-github-api";

const R = "/repos/acme/widgets";
let fixture: GithubFixture;
let restore: (() => void) | null = null;
let savedToken: string | undefined;

function issue(over: Record<string, unknown> = {}) {
  return {
    number: 3,
    title: "Fix login",
    body: "Steps",
    state: "open",
    html_url: "https://github.com/acme/widgets/issues/3",
    labels: [],
    ...over,
  };
}

function mock(issues: unknown[], extra: GithubMockRoute[] = []) {
  const m = mockGithubApi([
    { method: "GET", path: `${R}/issues`, body: issues },
    ...extra,
  ]);
  restore = m.restore;
  return m;
}

async function tasksOf(projectId: string) {
  return db.select().from(task).where(eq(task.projectId, projectId));
}

beforeEach(async () => {
  savedToken = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
  GithubSyncService.resetBackgroundSyncState();
  fixture = await createGithubFixture();
});

afterEach(async () => {
  restore?.();
  restore = null;
  if (savedToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = savedToken;
  await fixture.cleanup();
});

describe("syncProjectIssues", () => {
  test("creates a task from a new issue", async () => {
    mock([
      issue({ labels: [{ name: "status: in progress" }, "priority: high"] }),
    ]);
    const result = await GithubSyncService.syncProjectIssues(
      fixture.projectId,
      fixture.userId,
    );
    expect(result).toEqual({
      repository: "acme/widgets",
      createdCount: 1,
      updatedCount: 0,
      totalIssues: 1,
    });
    const [row] = await tasksOf(fixture.projectId);
    expect(row.title).toBe("Fix login");
    expect(row.description).toBe("Steps");
    expect(row.status).toBe("in_progress");
    expect(row.priority).toBe("high");
    expect(row.githubIssueNumber).toBe(3);
    expect(row.githubIssueUrl).toBe("https://github.com/acme/widgets/issues/3");
    expect(row.githubRepo).toBe("acme/widgets");
    expect(row.teamId).toBe(fixture.teamId);
    expect(row.creatorId).toBe(fixture.userId);
    expect(row.assigneeId).toBeNull();
  });

  test("new task defaults, truncation and next position", async () => {
    await insertTask({
      teamId: fixture.teamId,
      projectId: fixture.projectId,
      creatorId: fixture.userId,
      status: "todo",
      position: 7,
    });
    mock([
      issue({ number: 5, title: "   ", body: "x".repeat(6000) }),
      issue({ number: 6, title: "t".repeat(250), body: null }),
    ]);
    await GithubSyncService.syncProjectIssues(fixture.projectId);
    const rows = await tasksOf(fixture.projectId);
    const five = rows.find((r) => r.githubIssueNumber === 5)!;
    const six = rows.find((r) => r.githubIssueNumber === 6)!;
    expect(five.title).toBe("Untitled issue");
    expect(five.description?.length).toBe(5000);
    expect(five.status).toBe("todo");
    expect(five.priority).toBe("medium");
    expect(six.title.length).toBe(200);
    expect(six.description).toBeNull();
    expect(five.creatorId).toBe(fixture.userId);
    expect(new Set([five.position, six.position]).size).toBe(2);
    expect(Math.min(five.position, six.position)).toBeGreaterThan(7);
  });

  async function existing(status: "in_review" | "done", extra = {}) {
    return insertTask({
      teamId: fixture.teamId,
      projectId: fixture.projectId,
      creatorId: fixture.userId,
      status,
      priority: "urgent",
      title: "old",
      description: "old body",
      githubIssueNumber: 3,
      ...extra,
    });
  }

  async function syncOne(over: Record<string, unknown>) {
    mock([issue(over)]);
    const result = await GithubSyncService.syncProjectIssues(fixture.projectId);
    restore?.();
    const rows = await tasksOf(fixture.projectId);
    return { result, row: rows[0], count: rows.length };
  }

  test("closed issue marks existing task done, in place", async () => {
    const t = await existing("in_review");
    const { result, row, count } = await syncOne({ state: "closed" });
    expect(count).toBe(1);
    expect(row.id).toBe(t.id);
    expect(row.status).toBe("done");
    expect(row.title).toBe("Fix login");
    expect(row.description).toBe("Steps");
    expect(result).toMatchObject({ createdCount: 0, updatedCount: 1 });
  });

  test("closed as not planned gives cancelled", async () => {
    await existing("in_review");
    const { row } = await syncOne({
      state: "closed",
      state_reason: "not_planned",
    });
    expect(row.status).toBe("cancelled");
  });

  test("open issue without status label keeps in_review and priority", async () => {
    await existing("in_review");
    const { row } = await syncOne({});
    expect(row.status).toBe("in_review");
    expect(row.priority).toBe("urgent");
  });

  test("open issue without labels reopens a done task as todo", async () => {
    await existing("done");
    const { row } = await syncOne({});
    expect(row.status).toBe("todo");
  });

  test("ignores pull requests in the issues list", async () => {
    mock([issue(), issue({ number: 9, pull_request: { url: "x" } })]);
    const result = await GithubSyncService.syncProjectIssues(fixture.projectId);
    expect(result.totalIssues).toBe(1);
    expect(await tasksOf(fixture.projectId)).toHaveLength(1);
  });

  const pull = (over: Record<string, unknown> = {}) => ({
    number: 12,
    html_url: "https://github.com/acme/widgets/pull/12",
    title: "PR",
    state: "open",
    head: { ref: "feat/login" },
    ...over,
  });

  test("links a PR whose head ref equals the task branch", async () => {
    await existing("in_review", { githubBranch: "feat/login" });
    mock([issue()], [{ method: "GET", path: `${R}/pulls`, body: [pull()] }]);
    await GithubSyncService.syncProjectIssues(fixture.projectId);
    const [row] = await tasksOf(fixture.projectId);
    expect(row.githubPrNumber).toBe(12);
    expect(row.githubPrUrl).toBe("https://github.com/acme/widgets/pull/12");
    expect(row.githubPrStatus).toBe("open");
  });

  test("links a PR through the issue timeline and adopts its branch", async () => {
    mock(
      [issue()],
      [
        { method: "GET", path: `${R}/pulls`, body: [pull()] },
        {
          method: "GET",
          path: `${R}/issues/3/timeline`,
          body: [
            {
              event: "cross-referenced",
              source: {
                issue: {
                  number: 12,
                  pull_request: {},
                  repository: { full_name: "acme/widgets" },
                },
              },
            },
          ],
        },
      ],
    );
    await GithubSyncService.syncProjectIssues(fixture.projectId);
    const [row] = await tasksOf(fixture.projectId);
    expect(row.githubPrNumber).toBe(12);
    expect(row.githubBranch).toBe("feat/login");
  });

  test("does not link a PR that only mentions the issue in its body", async () => {
    mock(
      [issue()],
      [
        {
          method: "GET",
          path: `${R}/pulls`,
          body: [pull({ body: "Fixes #3", head: { ref: "other" } })],
        },
        { method: "GET", path: `${R}/issues/3/timeline`, body: [] },
      ],
    );
    await GithubSyncService.syncProjectIssues(fixture.projectId);
    const [row] = await tasksOf(fixture.projectId);
    expect(row.githubPrNumber).toBeNull();
    expect(row.githubBranch).toBeNull();
  });

  test("skips timeline requests when there are no pulls", async () => {
    const m = mock(
      [issue()],
      [{ method: "GET", path: `${R}/pulls`, body: [] }],
    );
    await GithubSyncService.syncProjectIssues(fixture.projectId);
    expect(m.calls.some((c) => c.path.includes("/timeline"))).toBe(false);
  });

  test("a failing pulls list counts as empty", async () => {
    mock([issue()], [{ method: "GET", path: `${R}/pulls`, status: 500 }]);
    const result = await GithubSyncService.syncProjectIssues(fixture.projectId);
    expect(result.createdCount).toBe(1);
  });

  test("sends only GET requests with the right query", async () => {
    const m = mock(
      [issue()],
      [{ method: "GET", path: `${R}/pulls`, body: [] }],
    );
    await GithubSyncService.syncProjectIssues(fixture.projectId);
    expect(m.calls.length).toBeGreaterThan(0);
    expect(m.calls.every((c) => c.method === "GET")).toBe(true);
    const issues = m.calls.find((c) => c.path === `${R}/issues`)!;
    expect(issues.search).toBe("?state=all&per_page=100");
  });

  test("does not touch a task of another project with the same issue number", async () => {
    const other = await createGithubFixture();
    try {
      const foreign = await insertTask({
        teamId: other.teamId,
        projectId: other.projectId,
        creatorId: other.userId,
        status: "done",
        title: "foreign",
        githubIssueNumber: 3,
      });
      mock([issue()]);
      const result = await GithubSyncService.syncProjectIssues(
        fixture.projectId,
      );
      expect(result).toMatchObject({ createdCount: 1, updatedCount: 0 });
      const [after] = await db
        .select()
        .from(task)
        .where(eq(task.id, foreign.id));
      expect(after.title).toBe("foreign");
      expect(after.status).toBe("done");
    } finally {
      await other.cleanup();
    }
  });

  test("a failing timeline request counts as no events and does not link", async () => {
    mock(
      [issue()],
      [
        {
          method: "GET",
          path: `${R}/pulls`,
          body: [pull({ head: { ref: "other" } })],
        },
        { method: "GET", path: `${R}/issues/3/timeline`, status: 500 },
      ],
    );
    const result = await GithubSyncService.syncProjectIssues(fixture.projectId);
    expect(result.createdCount).toBe(1);
    const [row] = await tasksOf(fixture.projectId);
    expect(row.githubPrNumber).toBeNull();
  });

  test("keeps an existing task branch when a timeline PR has another head", async () => {
    await existing("in_review", { githubBranch: "mine" });
    mock(
      [issue()],
      [
        { method: "GET", path: `${R}/pulls`, body: [pull()] },
        {
          method: "GET",
          path: `${R}/issues/3/timeline`,
          body: [
            {
              event: "cross-referenced",
              source: {
                issue: {
                  number: 12,
                  pull_request: {},
                  repository: { full_name: "acme/widgets" },
                },
              },
            },
          ],
        },
      ],
    );
    await GithubSyncService.syncProjectIssues(fixture.projectId);
    const [row] = await tasksOf(fixture.projectId);
    expect(row.githubPrNumber).toBe(12);
    expect(row.githubBranch).toBe("mine");
  });

  test("title and description at the exact limits are kept whole", async () => {
    mock([issue({ title: "t".repeat(200), body: "b".repeat(5000) })]);
    await GithubSyncService.syncProjectIssues(fixture.projectId);
    const [row] = await tasksOf(fixture.projectId);
    expect(row.title.length).toBe(200);
    expect(row.description?.length).toBe(5000);
  });

  test("creator falls back to the team owner when no user is given", async () => {
    mock([issue()]);
    await GithubSyncService.syncProjectIssues(fixture.projectId);
    const [row] = await tasksOf(fixture.projectId);
    expect(row.creatorId).toBe(fixture.userId);
  });

  test("unknown project throws", async () => {
    const id = crypto.randomUUID();
    await expect(GithubSyncService.syncProjectIssues(id)).rejects.toThrow(
      `Project with id "${id}" not found`,
    );
  });

  test("unlinked project throws", async () => {
    const other = await createGithubFixture({ repo: null });
    try {
      await expect(
        GithubSyncService.syncProjectIssues(other.projectId),
      ).rejects.toThrow("Project is not linked to a GitHub repository");
    } finally {
      await other.cleanup();
    }
  });

  test("a 500 issues response throws GithubApiError", async () => {
    mockGithubApi([{ method: "GET", path: `${R}/issues`, status: 500 }]);
    const err = await GithubSyncService.syncProjectIssues(
      fixture.projectId,
    ).catch((e) => e);
    expect(err).toBeInstanceOf(GithubApiError);
    expect(err.status).toBe(500);
    expect(err.message).toBe("GitHub API returned 500");
  });
});

describe("startBackgroundSync", () => {
  test("dedupes concurrent calls and throttles the next one", async () => {
    const m = mock(
      [issue()],
      [{ method: "GET", path: `${R}/pulls`, body: [] }],
    );
    const count = () => m.calls.filter((c) => c.path === `${R}/issues`).length;
    const [a, b] = await Promise.all([
      GithubSyncService.startBackgroundSync(fixture.projectId, fixture.userId),
      GithubSyncService.startBackgroundSync(fixture.projectId, fixture.userId),
    ]);
    expect(a).toEqual(b!);
    expect(a?.createdCount).toBe(1);
    expect(count()).toBe(1);
    const before = m.calls.length;
    const third = await GithubSyncService.startBackgroundSync(
      fixture.projectId,
      fixture.userId,
    );
    expect(third).toBeNull();
    expect(m.calls.length).toBe(before);
    expect(BACKGROUND_SYNC_MIN_INTERVAL_MS).toBe(60_000);
  });

  test("a failing sync resolves null and is throttled afterwards", async () => {
    const m = mockGithubApi([
      { method: "GET", path: `${R}/issues`, status: 500 },
    ]);
    restore = m.restore;
    const first = await GithubSyncService.startBackgroundSync(
      fixture.projectId,
    );
    expect(first).toBeNull();
    const n = m.calls.length;
    expect(
      await GithubSyncService.startBackgroundSync(fixture.projectId),
    ).toBeNull();
    expect(m.calls.length).toBe(n);
  });

  test("resetBackgroundSyncState clears the throttle", async () => {
    const m = mock(
      [issue()],
      [{ method: "GET", path: `${R}/pulls`, body: [] }],
    );
    await GithubSyncService.startBackgroundSync(fixture.projectId);
    GithubSyncService.resetBackgroundSyncState();
    const again = await GithubSyncService.startBackgroundSync(
      fixture.projectId,
    );
    expect(again).not.toBeNull();
    expect(m.calls.filter((c) => c.path === `${R}/issues`).length).toBe(2);
  });
});
