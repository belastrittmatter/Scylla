import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { TeamService } from "@/services/team/team-service";
import {
  createTaskBranchAction,
  createTaskIssueAction,
  getTaskDevelopmentAction,
  getTaskCommentsAction,
  createTaskCommentAction,
} from "@/actions";
import { mockGithubApi } from "../test-utils/mock-github-api";
import { mockSessionUser } from "../test-utils/mock-session";
import {
  createGithubFixture,
  insertTask,
  type GithubFixture,
} from "../test-utils/github-fixtures";

const R = "/repos/acme/widgets";

describe("task GitHub server actions", () => {
  let fx: GithubFixture;
  let viewerId: string;
  let outsiderId: string;
  let linkedTaskId: string;
  let unlinkedTaskId: string;
  let unlinkedFx: GithubFixture;
  let cleanup: Array<() => void> = [];

  async function makeUser(label: string) {
    const id = crypto.randomUUID();
    await db
      .insert(user)
      .values({ id, name: label, email: `${label}-${id}@example.com` });
    return id;
  }

  beforeAll(async () => {
    delete process.env.GITHUB_TOKEN;
    fx = await createGithubFixture();
    unlinkedFx = await createGithubFixture({ repo: null });
    viewerId = await makeUser("viewer");
    outsiderId = await makeUser("outsider");
    await TeamService.addTeamMember({
      teamId: fx.teamId,
      userId: viewerId,
      role: "viewer",
    });
    linkedTaskId = (
      await insertTask({
        teamId: fx.teamId,
        projectId: fx.projectId,
        creatorId: fx.userId,
        title: "Fix the widget",
      })
    ).id;
    unlinkedTaskId = (
      await insertTask({
        teamId: unlinkedFx.teamId,
        projectId: unlinkedFx.projectId,
        creatorId: unlinkedFx.userId,
      })
    ).id;
  });

  afterEach(() => {
    cleanup.forEach((fn) => fn());
    cleanup = [];
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, viewerId));
    await db.delete(user).where(eq(user.id, outsiderId));
    await fx.cleanup();
    await unlinkedFx.cleanup();
  });

  function as(userId: string) {
    const s = mockSessionUser(userId);
    cleanup.push(() => s.mockRestore());
  }
  function github(routes: Parameters<typeof mockGithubApi>[0]) {
    const m = mockGithubApi(routes);
    cleanup.push(m.restore);
    return m;
  }
  const branchRoutes = [
    { method: "GET", path: R, body: { default_branch: "main" } },
    {
      method: "GET",
      path: `${R}/git/ref/heads/main`,
      body: { object: { sha: "abc" } },
    },
    { method: "POST", path: `${R}/git/refs`, status: 201, body: {} },
  ];

  it("getTaskDevelopmentAction returns info for a member", async () => {
    as(fx.userId);
    github([{ method: "GET", path: `${R}/pulls`, body: [] }]);
    const res = await getTaskDevelopmentAction(linkedTaskId);
    expect(res.success).toBe(true);
    expect(res.data?.repository).toBe("acme/widgets");
    expect(res.data?.suggestedBranch).toContain("fix-the-widget");
  });

  it("getTaskDevelopmentAction denies non-members and validates input", async () => {
    as(outsiderId);
    github([]);
    expect(await getTaskDevelopmentAction(linkedTaskId)).toEqual({
      success: false,
      error: "Access denied",
    });
    expect(await getTaskDevelopmentAction("")).toEqual({
      success: false,
      error: "Task ID is required",
    });
    expect(await getTaskDevelopmentAction("missing-id")).toEqual({
      success: false,
      error: "Task not found",
    });
  });

  it("createTaskBranchAction returns the branch and checkout command", async () => {
    as(fx.userId);
    github(branchRoutes);
    const res = await createTaskBranchAction(linkedTaskId);
    expect(res.success).toBe(true);
    expect(res.data?.branch).toStartWith("feat/");
    expect(res.data?.checkoutCommand).toBe(
      `git fetch origin && git checkout ${res.data?.branch}`,
    );
  });

  it("createTaskBranchAction rejects viewers and unlinked tasks", async () => {
    as(viewerId);
    github(branchRoutes);
    expect(await createTaskBranchAction(linkedTaskId)).toEqual({
      success: false,
      error: "Permission denied: viewers cannot change GitHub links",
    });
    cleanup.forEach((fn) => fn());
    cleanup = [];
    as(unlinkedFx.userId);
    expect(await createTaskBranchAction(unlinkedTaskId)).toEqual({
      success: false,
      error: "Task is not linked to a GitHub repository",
    });
  });

  it("createTaskBranchAction surfaces an invalid branch name", async () => {
    as(fx.userId);
    github(branchRoutes);
    const res = await createTaskBranchAction(linkedTaskId, "bad name");
    expect(res).toEqual({ success: false, error: "Invalid branch name" });
  });

  it("createTaskIssueAction creates the issue, then returns the same one", async () => {
    as(fx.userId);
    const issueTask = await insertTask({
      teamId: fx.teamId,
      projectId: fx.projectId,
      creatorId: fx.userId,
    });
    const m = github([
      {
        method: "POST",
        path: `${R}/issues`,
        status: 201,
        body: {
          number: 12,
          html_url: "https://github.com/acme/widgets/issues/12",
        },
      },
    ]);
    const first = await createTaskIssueAction(issueTask.id);
    expect(first).toEqual({
      success: true,
      data: { number: 12, url: "https://github.com/acme/widgets/issues/12" },
    });
    const second = await createTaskIssueAction(issueTask.id);
    expect(second.data?.number).toBe(12);
    expect(m.calls.filter((c) => c.method === "POST")).toHaveLength(1);
  });

  it("createTaskIssueAction reports a GitHub failure", async () => {
    as(fx.userId);
    github([{ method: "POST", path: `${R}/issues`, status: 500 }]);
    const t = await insertTask({
      teamId: fx.teamId,
      projectId: fx.projectId,
      creatorId: fx.userId,
    });
    expect(await createTaskIssueAction(t.id)).toEqual({
      success: false,
      error: "Failed to create GitHub issue",
    });
  });

  it("every action fails without a session", async () => {
    for (const res of [
      await getTaskDevelopmentAction(linkedTaskId),
      await createTaskBranchAction(linkedTaskId),
      await createTaskIssueAction(linkedTaskId),
    ]) {
      expect(res.success).toBe(false);
      expect(res.error).toBeTruthy();
    }
  });

  it("createTaskIssueAction rejects viewers", async () => {
    as(viewerId);
    const m = github([]);
    expect(await createTaskIssueAction(linkedTaskId)).toEqual({
      success: false,
      error: "Permission denied: viewers cannot change GitHub links",
    });
    expect(m.calls).toHaveLength(0);
  });

  it("createTaskBranchAction and createTaskIssueAction deny non-members", async () => {
    as(outsiderId);
    const m = github(branchRoutes);
    for (const res of [
      await createTaskBranchAction(linkedTaskId),
      await createTaskIssueAction(linkedTaskId),
    ]) {
      expect(res).toEqual({ success: false, error: "Access denied" });
    }
    expect(m.calls).toHaveLength(0);
  });

  it("createTaskIssueAction rejects an unlinked task", async () => {
    as(unlinkedFx.userId);
    expect(await createTaskIssueAction(unlinkedTaskId)).toEqual({
      success: false,
      error: "Task is not linked to a GitHub repository",
    });
  });

  it("comment actions merge GitHub comments and deny non-members without calling GitHub", async () => {
    const issueTask = await insertTask({
      teamId: fx.teamId,
      projectId: fx.projectId,
      creatorId: fx.userId,
      githubRepo: "acme/widgets",
      githubIssueNumber: 9,
    });
    const path = `${R}/issues/9/comments`;
    as(fx.userId);
    const m = github([
      {
        method: "GET",
        path,
        body: [
          {
            id: 77,
            body: "from github",
            html_url: "https://github.com/acme/widgets/issues/9#c77",
            created_at: "2031-01-01T00:00:00Z",
            updated_at: "2031-01-01T00:00:00Z",
            user: { login: "octocat", avatar_url: "https://a/o" },
          },
        ],
      },
      { method: "POST", path, status: 201, body: { id: 88, html_url: "u" } },
    ]);
    const list = await getTaskCommentsAction(issueTask.id);
    expect(list.data?.map((c) => c.source)).toEqual(["github"]);
    const added = await createTaskCommentAction({
      taskId: issueTask.id,
      content: "hi",
    });
    expect(added.data?.githubCommentId).toBe("88");
    cleanup.forEach((fn) => fn());
    cleanup = [];

    as(outsiderId);
    const m2 = github([]);
    expect(await getTaskCommentsAction(issueTask.id)).toEqual({
      success: false,
      error: "Access denied",
    });
    expect(
      await createTaskCommentAction({ taskId: issueTask.id, content: "x" }),
    ).toEqual({ success: false, error: "Access denied" });
    expect(m2.calls).toHaveLength(0);
    expect(m.calls.length).toBeGreaterThan(0);
  });
});
