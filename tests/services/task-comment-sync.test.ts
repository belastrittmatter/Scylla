import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  account,
  project as projectTable,
  task,
  taskComment,
  user,
} from "@/db/schema";
import { TeamService } from "@/services/team/team-service";
import { TaskService } from "@/services/task/task-service";
import { TaskWorkspaceService } from "@/services/task/task-workspace-service";
import { GithubCommentService } from "@/services/github/github-comment-service";

interface Recorded {
  url: string;
  method: string;
  body: string | null;
  auth: string | null;
}

const originalFetch = globalThis.fetch;
let calls: Recorded[] = [];
let handler: (c: Recorded) => Response;

beforeEach(() => {
  calls = [];
  handler = () => new Response("unexpected", { status: 500 });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const rec: Recorded = {
      url: String(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? init.body : null,
      auth: headers.get("Authorization"),
    };
    calls.push(rec);
    return handler(rec);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

const ISSUE_URL = "https://api.github.com/repos/octo/repo/issues/42/comments";

async function setup(opts: { linked: boolean; connected: boolean }) {
  const tag = crypto.randomUUID();
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "Ann Author",
      email: `a-${tag}@example.com`,
    })
    .returning();
  if (opts.connected) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "12345",
      providerId: "github",
      userId: u.id,
      accessToken: "gho_creator",
    });
  }
  const team = await TeamService.createTeam({
    name: `T ${tag}`,
    ownerId: u.id,
  });
  // Inserted directly: tests/ui/project-settings.test.tsx replaces the
  // ProjectService module, and that replacement can leak into later files.
  const [project] = await db
    .insert(projectTable)
    .values({
      name: `P ${tag}`,
      slug: `p-${tag}`,
      teamId: team.id,
      githubRepo: "octo/repo",
    })
    .returning();
  const t = await TaskService.createTask({
    title: "t",
    teamId: team.id,
    projectId: opts.linked ? project.id : undefined,
    creatorId: u.id,
    status: "todo",
    priority: "medium",
  });
  if (opts.linked) {
    await db
      .update(task)
      .set({ githubIssueNumber: 42 })
      .where(eq(task.id, t.id));
  }
  return { u, t, cleanup: () => db.delete(user).where(eq(user.id, u.id)) };
}

async function withoutEnvTokens<T>(fn: () => Promise<T>): Promise<T> {
  const a = process.env.GITHUB_TOKEN;
  const b = process.env.GITHUB_ACCESS_TOKEN;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_ACCESS_TOKEN;
  try {
    return await fn();
  } finally {
    if (a !== undefined) process.env.GITHUB_TOKEN = a;
    if (b !== undefined) process.env.GITHUB_ACCESS_TOKEN = b;
  }
}

const T = { timeout: 30000 };

describe("task comment sync", () => {
  it(
    "keeps comments local for an unlinked task",
    async () => {
      const { u, t, cleanup } = await setup({ linked: false, connected: true });
      const c = await TaskWorkspaceService.createTaskComment({
        taskId: t.id,
        userId: u.id,
        content: "hi",
      });
      expect(c.source).toBe("local");
      expect(c.githubCommentId).toBeNull();
      expect(c.htmlUrl).toBeNull();
      expect(c.user?.id).toBe(u.id);
      const list = await TaskWorkspaceService.getTaskComments(t.id, u.id);
      expect(list.map((x) => x.id)).toEqual([c.id]);
      expect(calls).toEqual([]);
      await cleanup();
    },
    T,
  );

  it(
    "posts to the linked issue and stores the github id",
    async () => {
      const { u, t, cleanup } = await setup({ linked: true, connected: true });
      handler = () =>
        json(
          { id: 991, html_url: "https://github.com/octo/repo/issues/42#c991" },
          201,
        );
      const c = await TaskWorkspaceService.createTaskComment({
        taskId: t.id,
        userId: u.id,
        content: "  Hello  ",
      });
      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toBe(ISSUE_URL);
      expect(JSON.parse(calls[0].body ?? "{}")).toEqual({ body: "Hello" });
      expect(c.githubCommentId).toBe("991");
      expect(c.htmlUrl).toBe("https://github.com/octo/repo/issues/42#c991");
      expect(c.source).toBe("local");
      const [row] = await db
        .select()
        .from(taskComment)
        .where(eq(taskComment.id, c.id));
      expect(row.githubCommentId).toBe("991");
      expect(row.content).toBe("Hello");
      await cleanup();
    },
    T,
  );

  it(
    "still creates the comment when GitHub returns 500",
    async () => {
      const { u, t, cleanup } = await setup({ linked: true, connected: true });
      const c = await TaskWorkspaceService.createTaskComment({
        taskId: t.id,
        userId: u.id,
        content: "x",
      });
      expect(calls.length).toBeGreaterThan(0);
      expect(c.githubCommentId).toBeNull();
      expect(c.htmlUrl).toBeNull();
      await cleanup();
    },
    T,
  );

  it(
    "makes no request when the author has no token",
    async () => {
      const { u, t, cleanup } = await setup({ linked: true, connected: false });
      const c = await withoutEnvTokens(() =>
        TaskWorkspaceService.createTaskComment({
          taskId: t.id,
          userId: u.id,
          content: "x",
        }),
      );
      expect(c.githubCommentId).toBeNull();
      expect(calls).toEqual([]);
      await cleanup();
    },
    T,
  );

  it(
    "merges github comments without duplicates, ordered by createdAt",
    async () => {
      const { u, t, cleanup } = await setup({ linked: true, connected: true });
      await db.insert(taskComment).values({
        taskId: t.id,
        userId: u.id,
        content: "local",
        githubCommentId: "991",
        createdAt: new Date("2026-02-01T00:00:00Z"),
      });
      handler = (c) =>
        c.url === `${ISSUE_URL}?per_page=100`
          ? json([
              {
                id: 991,
                body: "local",
                html_url: "https://github.com/h/991",
                created_at: "2026-02-01T00:00:00Z",
                updated_at: "2026-02-01T00:00:00Z",
                user: { id: 7, login: "ann", avatar_url: "https://a/7" },
              },
              {
                id: 992,
                body: "from gh",
                html_url: "https://github.com/h/992",
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-02T00:00:00Z",
                user: { id: 8, login: "bob", avatar_url: "https://a/8" },
              },
            ])
          : new Response("no", { status: 500 });
      const list = await TaskWorkspaceService.getTaskComments(t.id, u.id);
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe("gh-992");
      expect(list[0].source).toBe("github");
      expect(list[0].userId).toBe("gh-user-8");
      expect(list[0].githubCommentId).toBe("992");
      expect(list[0].user?.name).toBe("bob");
      expect(list[0].user?.role).toBe("github");
      expect(list[0].user?.initials).toBe("BO");
      expect(list[0].htmlUrl).toBe("https://github.com/h/992");
      expect(list[0].createdAt).toBeInstanceOf(Date);
      expect(list[1].source).toBe("local");
      await cleanup();
    },
    T,
  );

  it(
    "returns only local comments when the GitHub list fails",
    async () => {
      const { u, t, cleanup } = await setup({ linked: true, connected: true });
      await db
        .insert(taskComment)
        .values({ taskId: t.id, userId: u.id, content: "mine" });
      const list = await TaskWorkspaceService.getTaskComments(t.id, u.id);
      expect(list.map((c) => c.content)).toEqual(["mine"]);
      expect(list[0].source).toBe("local");
      await cleanup();
    },
    T,
  );

  it(
    "uses the creator's token when no userId is given",
    async () => {
      const { t, cleanup } = await setup({ linked: true, connected: true });
      handler = () => json([]);
      await TaskWorkspaceService.getTaskComments(t.id);
      expect(calls).toHaveLength(1);
      expect(calls[0].auth).toBe("Bearer gho_creator");
      await cleanup();
    },
    T,
  );

  it(
    "makes no request for a task without an issue number",
    async () => {
      const { u, t, cleanup } = await setup({ linked: true, connected: true });
      await db
        .update(task)
        .set({ githubIssueNumber: null })
        .where(eq(task.id, t.id));
      expect(await GithubCommentService.listIssueComments(t.id, u.id)).toEqual(
        [],
      );
      expect(
        await GithubCommentService.createIssueComment(t.id, "x", u.id),
      ).toBeNull();
      expect(calls).toEqual([]);
      await cleanup();
    },
    T,
  );

  it(
    "TaskService delegates comments for an unlinked task",
    async () => {
      const { u, t, cleanup } = await setup({
        linked: false,
        connected: false,
      });
      const c = await TaskService.createTaskComment({
        taskId: t.id,
        userId: u.id,
        content: " y ",
      });
      expect(c.content).toBe("y");
      const list = await TaskService.getTaskComments(t.id);
      expect(list.map((x) => x.id)).toEqual([c.id]);
      await cleanup();
    },
    T,
  );
});

describe("task comment sync, acting user and failure paths", () => {
  async function otherUser() {
    const [o] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Other",
        email: `o-${crypto.randomUUID()}@example.com`,
      })
      .returning();
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "777",
      providerId: "github",
      userId: o.id,
      accessToken: "gho_other",
    });
    return o;
  }

  it(
    "posts with the author's token, not the task creator's",
    async () => {
      const { t, cleanup } = await setup({ linked: true, connected: true });
      const o = await otherUser();
      handler = () => json({ id: 5, html_url: "https://github.com/h/5" }, 201);
      await TaskWorkspaceService.createTaskComment({
        taskId: t.id,
        userId: o.id,
        content: "x",
      });
      expect(calls).toHaveLength(1);
      expect(calls[0].auth).toBe("Bearer gho_other");
      await db.delete(user).where(eq(user.id, o.id));
      await cleanup();
    },
    T,
  );

  it(
    "reads with the given userId's token over the creator's",
    async () => {
      const { t, cleanup } = await setup({ linked: true, connected: true });
      const o = await otherUser();
      handler = () => json([]);
      await TaskWorkspaceService.getTaskComments(t.id, o.id);
      expect(calls).toHaveLength(1);
      expect(calls[0].auth).toBe("Bearer gho_other");
      expect(calls[0].method).toBe("GET");
      expect(calls[0].url).toBe(`${ISSUE_URL}?per_page=100`);
      await db.delete(user).where(eq(user.id, o.id));
      await cleanup();
    },
    T,
  );

  it(
    "maps a github comment without an author",
    async () => {
      const { u, t, cleanup } = await setup({ linked: true, connected: true });
      handler = () =>
        json([
          {
            id: 993,
            body: "anon",
            html_url: "https://github.com/h/993",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
            user: null,
          },
        ]);
      const list = await TaskWorkspaceService.getTaskComments(t.id, u.id);
      expect(list).toHaveLength(1);
      expect(list[0].userId).toBe("gh-user-unknown");
      expect(list[0].user?.name).toBe("GitHub user");
      expect(list[0].user?.role).toBe("github");
      expect(list[0].user?.image).toBeNull();
      expect(list[0].user?.avatarUrl).toBe("");
      await cleanup();
    },
    T,
  );

  it(
    "survives a thrown fetch on list and create",
    async () => {
      const { u, t, cleanup } = await setup({ linked: true, connected: true });
      globalThis.fetch = (async () => {
        throw new Error("network down");
      }) as unknown as typeof fetch;
      await db
        .insert(taskComment)
        .values({ taskId: t.id, userId: u.id, content: "mine" });
      const list = await TaskWorkspaceService.getTaskComments(t.id, u.id);
      expect(list.map((c) => c.content)).toEqual(["mine"]);
      const c = await TaskWorkspaceService.createTaskComment({
        taskId: t.id,
        userId: u.id,
        content: "y",
      });
      expect(c.githubCommentId).toBeNull();
      expect(c.htmlUrl).toBeNull();
      await cleanup();
    },
    T,
  );

  it(
    "returns [] and null for an unlinked task without fetching",
    async () => {
      const { u, t, cleanup } = await setup({ linked: false, connected: true });
      expect(await GithubCommentService.listIssueComments(t.id, u.id)).toEqual(
        [],
      );
      expect(
        await GithubCommentService.createIssueComment(t.id, "x", u.id),
      ).toBeNull();
      expect(calls).toEqual([]);
      await cleanup();
    },
    T,
  );
});
