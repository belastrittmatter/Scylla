import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { user, project, task, taskComment } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { TeamService } from "@/services/team/team-service";
import { TaskWorkspaceService } from "@/services/task/task-workspace-service";
import { mockGithubApi } from "../test-utils/mock-github-api";
import {
  createGithubFixture,
  insertTask,
  type GithubFixture,
} from "../test-utils/github-fixtures";

describe("TaskWorkspaceService multi-tenant scoping", () => {
  it("returns empty workspace when unauthenticated (no userId)", async () => {
    const data = await TaskWorkspaceService.getWorkspaceData(undefined);
    expect(data.teams).toEqual([]);
    expect(data.projects).toEqual([]);
    expect(data.tasks).toEqual([]);
    expect(data.users).toEqual([]);
    expect(data.teamMembers).toEqual([]);
  });

  it(
    "scopes workspace data strictly to caller's teams and does not leak other teams' data",
    async () => {
      const timestamp = Date.now();

      // Create User A and User B
      const [userA] = await db
        .insert(user)
        .values({
          id: `usr_tenant_a_${timestamp}`,
          name: "Tenant A User",
          email: `tenant_a_${timestamp}@example.com`,
        })
        .returning();

      const [userB] = await db
        .insert(user)
        .values({
          id: `usr_tenant_b_${timestamp}`,
          name: "Tenant B User",
          email: `tenant_b_${timestamp}@example.com`,
        })
        .returning();

      // Team A owned by User A
      const teamA = await TeamService.createTeam({
        name: `Team A ${timestamp}`,
        slug: `team-a-${timestamp}`,
        ownerId: userA.id,
      });

      // Team B owned by User B
      const teamB = await TeamService.createTeam({
        name: `Team B ${timestamp}`,
        slug: `team-b-${timestamp}`,
        ownerId: userB.id,
      });

      // Project in Team A
      const [projectA] = await db
        .insert(project)
        .values({
          name: `Project A ${timestamp}`,
          slug: `proj-a-${timestamp}`,
          teamId: teamA.id,
        })
        .returning();

      // Project in Team B
      const [projectB] = await db
        .insert(project)
        .values({
          name: `Project B ${timestamp}`,
          slug: `proj-b-${timestamp}`,
          teamId: teamB.id,
        })
        .returning();

      // Task in Team A
      await db.insert(task).values({
        title: "Secret Task A",
        teamId: teamA.id,
        projectId: projectA.id,
        creatorId: userA.id,
      });

      // Task in Team B
      await db.insert(task).values({
        title: "Secret Task B",
        teamId: teamB.id,
        projectId: projectB.id,
        creatorId: userB.id,
      });

      // Fetch workspace as User A
      const wsA = await TaskWorkspaceService.getWorkspaceData(userA.id);
      expect(wsA.teams.some((t) => t.id === teamA.id)).toBe(true);
      expect(wsA.teams.some((t) => t.id === teamB.id)).toBe(false);

      expect(wsA.projects.some((p) => p.id === projectA.id)).toBe(true);
      expect(wsA.projects.some((p) => p.id === projectB.id)).toBe(false);

      expect(wsA.tasks.some((t) => t.title === "Secret Task A")).toBe(true);
      expect(wsA.tasks.some((t) => t.title === "Secret Task B")).toBe(false);

      // Fetch workspace as User B
      const wsB = await TaskWorkspaceService.getWorkspaceData(userB.id);
      expect(wsB.teams.some((t) => t.id === teamB.id)).toBe(true);
      expect(wsB.teams.some((t) => t.id === teamA.id)).toBe(false);

      expect(wsB.projects.some((p) => p.id === projectB.id)).toBe(true);
      expect(wsB.projects.some((p) => p.id === projectA.id)).toBe(false);

      expect(wsB.tasks.some((t) => t.title === "Secret Task B")).toBe(true);
      expect(wsB.tasks.some((t) => t.title === "Secret Task A")).toBe(false);

      // Clean up
      await TeamService.deleteTeam(teamA.id);
      await TeamService.deleteTeam(teamB.id);
      await db.delete(user).where(inArray(user.id, [userA.id, userB.id]));
    },
    { timeout: 30000 },
  );
});

describe("TaskWorkspaceService GitHub data", () => {
  let fx: GithubFixture;
  let memberB: string;
  let linkedTaskId: string;
  let restore: (() => void) | undefined;
  const COMMENTS = "/repos/acme/widgets/issues/5/comments";

  const ghComment = (id: number, login: string, createdAt: string) => ({
    id,
    body: `body ${id}`,
    html_url: `https://github.com/acme/widgets/issues/5#issuecomment-${id}`,
    created_at: createdAt,
    updated_at: createdAt,
    user: { login, avatar_url: `https://avatars/${login}` },
  });

  beforeAll(async () => {
    delete process.env.GITHUB_TOKEN;
    fx = await createGithubFixture();
    memberB = crypto.randomUUID();
    await db.insert(user).values({
      id: memberB,
      name: "No Github",
      email: `nogh-${memberB}@example.com`,
    });
    await TeamService.addTeamMember({
      teamId: fx.teamId,
      userId: memberB,
      role: "member",
    });
    const row = await insertTask({
      teamId: fx.teamId,
      projectId: fx.projectId,
      creatorId: fx.userId,
      githubRepo: "acme/widgets",
      githubIssueNumber: 5,
    });
    linkedTaskId = row.id;
  });
  afterEach(() => restore?.());
  afterAll(async () => {
    await db.delete(user).where(eq(user.id, memberB));
    await fx.cleanup();
  });

  it("flags users with githubConnected", async () => {
    const ws = await TaskWorkspaceService.getWorkspaceData(fx.userId);
    expect(ws.users.find((u) => u.id === fx.userId)?.githubConnected).toBe(
      true,
    );
    expect(ws.users.find((u) => u.id === memberB)?.githubConnected).toBe(false);
  });

  it("merges local and GitHub comments without duplicates, oldest first", async () => {
    const mock = mockGithubApi([
      {
        method: "GET",
        path: COMMENTS,
        body: [
          ghComment(111, "octocat", "2030-01-02T00:00:00Z"),
          ghComment(222, "hubot", "2030-01-03T00:00:00Z"),
        ],
      },
    ]);
    restore = mock.restore;
    const [local] = await db
      .insert(taskComment)
      .values({
        taskId: linkedTaskId,
        userId: fx.userId,
        content: "local one",
        githubCommentId: "111",
        createdAt: new Date("2030-01-01T00:00:00Z"),
      })
      .returning();
    const list = await TaskWorkspaceService.getTaskComments(
      linkedTaskId,
      fx.userId,
    );
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(local.id);
    expect(list[0].source).toBe("local");
    expect(list[0].htmlUrl).toBe(
      "https://github.com/acme/widgets/issues/5#issuecomment-111",
    );
    expect(list[1].source).toBe("github");
    expect(list[1].id).toBe("github-222");
    expect(list[1].user?.name).toBe("hubot");
    expect(list[1].user?.initials).toBe("HU");
    expect(list[1].content).toBe("body 222");
    await db.delete(taskComment).where(eq(taskComment.id, local.id));
  });

  it("returns local comments only when GitHub fails", async () => {
    const mock = mockGithubApi([
      { method: "GET", path: COMMENTS, status: 500 },
    ]);
    restore = mock.restore;
    const [local] = await db
      .insert(taskComment)
      .values({ taskId: linkedTaskId, userId: fx.userId, content: "only" })
      .returning();
    const list = await TaskWorkspaceService.getTaskComments(linkedTaskId);
    expect(list.map((c) => c.id)).toEqual([local.id]);
    await db.delete(taskComment).where(eq(taskComment.id, local.id));
  });

  it("makes no GitHub call for an unlinked task", async () => {
    const mock = mockGithubApi([]);
    restore = mock.restore;
    const row = await insertTask({
      teamId: fx.teamId,
      projectId: fx.projectId,
      creatorId: fx.userId,
    });
    const list = await TaskWorkspaceService.getTaskComments(row.id, fx.userId);
    expect(list).toEqual([]);
    expect(mock.calls).toHaveLength(0);
  });

  it("posts a new comment to the issue and stores githubCommentId", async () => {
    const mock = mockGithubApi([
      {
        method: "POST",
        path: COMMENTS,
        status: 201,
        body: { id: 333, html_url: "https://github.com/x/y/issues/5#c333" },
      },
    ]);
    restore = mock.restore;
    const created = await TaskWorkspaceService.createTaskComment({
      taskId: linkedTaskId,
      userId: fx.userId,
      content: "  hello  ",
    });
    expect((mock.calls[0].body as { body: string }).body).toBe("hello");
    expect(created.source).toBe("local");
    expect(created.githubCommentId).toBe("333");
    expect(created.htmlUrl).toBe("https://github.com/x/y/issues/5#c333");
    const [stored] = await db
      .select()
      .from(taskComment)
      .where(eq(taskComment.id, created.id));
    expect(stored.githubCommentId).toBe("333");
  });

  it("keeps the local comment when GitHub rejects the post", async () => {
    const mock = mockGithubApi([
      { method: "POST", path: COMMENTS, status: 500 },
    ]);
    restore = mock.restore;
    const created = await TaskWorkspaceService.createTaskComment({
      taskId: linkedTaskId,
      userId: fx.userId,
      content: "offline",
    });
    expect(created.githubCommentId).toBeNull();
    expect(created.htmlUrl).toBeNull();
  });
});
