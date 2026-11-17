import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { TeamService } from "@/services/team/team-service";
import { TaskService } from "@/services/task/task-service";
import { TaskAssigneeGithubError } from "@/services/task/task-assignee-rules";
import { mockGithubApi } from "../test-utils/mock-github-api";
import {
  createGithubFixture,
  insertTask,
  type GithubFixture,
} from "../test-utils/github-fixtures";

async function addMemberWithoutGithub(teamId: string, name: string) {
  const id = crypto.randomUUID();
  await db
    .insert(user)
    .values({ id, name, email: `assignee-${id}@example.com` });
  await TeamService.addTeamMember({ teamId, userId: id, role: "member" });
  return id;
}

describe("assignee GitHub rule in TaskService", () => {
  let linked: GithubFixture;
  let unlinked: GithubFixture;
  let memberB: string;
  let memberBUnlinkedTeam: string;
  let restore: (() => void) | undefined;

  beforeAll(async () => {
    delete process.env.GITHUB_TOKEN;
    linked = await createGithubFixture();
    unlinked = await createGithubFixture({ repo: null });
    memberB = await addMemberWithoutGithub(linked.teamId, "Bea Builder");
    memberBUnlinkedTeam = await addMemberWithoutGithub(
      unlinked.teamId,
      "Bea Builder",
    );
  });

  afterEach(() => restore?.());

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, memberB));
    await db.delete(user).where(eq(user.id, memberBUnlinkedTeam));
    await linked.cleanup();
    await unlinked.cleanup();
  });

  function mockIssues() {
    const mock = mockGithubApi([
      {
        method: "POST",
        path: "/repos/acme/widgets/issues",
        status: 201,
        body: {
          number: 1,
          html_url: "https://github.com/acme/widgets/issues/1",
        },
      },
      {
        method: "PATCH",
        path: /\/repos\/acme\/widgets\/issues\/\d+/,
        body: {},
      },
    ]);
    restore = mock.restore;
  }

  it("createTask rejects assigning a member without GitHub", async () => {
    mockIssues();
    const attempt = TaskService.createTask({
      title: "t",
      status: "todo",
      priority: "medium",
      teamId: linked.teamId,
      projectId: linked.projectId,
      creatorId: linked.userId,
      assigneeId: memberB,
    });
    await expect(attempt).rejects.toBeInstanceOf(TaskAssigneeGithubError);
    await expect(attempt).rejects.toThrow("Bea Builder");
  });

  it("createTask accepts a member with GitHub", async () => {
    mockIssues();
    const created = await TaskService.createTask({
      title: "t",
      status: "todo",
      priority: "medium",
      teamId: linked.teamId,
      projectId: linked.projectId,
      creatorId: linked.userId,
      assigneeId: linked.userId,
    });
    expect(created.assigneeId).toBe(linked.userId);
  });

  it("createTask accepts a member without GitHub in an unlinked project", async () => {
    mockIssues();
    const created = await TaskService.createTask({
      title: "t",
      status: "todo",
      priority: "medium",
      teamId: unlinked.teamId,
      projectId: unlinked.projectId,
      creatorId: unlinked.userId,
      assigneeId: memberBUnlinkedTeam,
    });
    expect(created.assigneeId).toBe(memberBUnlinkedTeam);
  });

  it("updateTask rejects setting the assignee to a member without GitHub", async () => {
    mockIssues();
    const row = await insertTask({
      teamId: linked.teamId,
      projectId: linked.projectId,
      creatorId: linked.userId,
    });
    await expect(
      TaskService.updateTask(row.id, { assigneeId: memberB }, linked.userId),
    ).rejects.toBeInstanceOf(TaskAssigneeGithubError);
  });

  it("updateTask re-sending the unchanged assignee does not fail", async () => {
    mockIssues();
    const row = await insertTask({
      teamId: linked.teamId,
      projectId: linked.projectId,
      creatorId: linked.userId,
      assigneeId: memberB,
    });
    const updated = await TaskService.updateTask(
      row.id,
      { title: "Renamed", assigneeId: memberB },
      linked.userId,
    );
    expect(updated.title).toBe("Renamed");
    expect(updated.assigneeId).toBe(memberB);
  });

  it("updateTask rejects moving a task with such an assignee into a linked project", async () => {
    mockIssues();
    const moving = await createGithubFixture({ repo: null });
    const other = await db.query.project.findFirst({
      where: (p, { eq: e }) => e(p.id, linked.projectId),
    });
    expect(other?.githubRepo).toBe("acme/widgets");
    // a linked project in the same team as the task
    const { ProjectService } =
      await import("@/services/project/project-service");
    const linkedSameTeam = await ProjectService.createProject({
      name: "Linked same team",
      teamId: moving.teamId,
      githubRepo: "acme/widgets",
    });
    const bea = await addMemberWithoutGithub(moving.teamId, "Bea Mover");
    try {
      const row = await insertTask({
        teamId: moving.teamId,
        projectId: moving.projectId,
        creatorId: moving.userId,
        assigneeId: bea,
      });
      await expect(
        TaskService.updateTask(
          row.id,
          { projectId: linkedSameTeam.id },
          moving.userId,
        ),
      ).rejects.toBeInstanceOf(TaskAssigneeGithubError);
    } finally {
      await db.delete(user).where(eq(user.id, bea));
      await moving.cleanup();
    }
  });

  it("updateTask can clear the assignee in a linked project", async () => {
    mockIssues();
    const row = await insertTask({
      teamId: linked.teamId,
      projectId: linked.projectId,
      creatorId: linked.userId,
      assigneeId: memberB,
    });
    const updated = await TaskService.updateTask(
      row.id,
      { assigneeId: null },
      linked.userId,
    );
    expect(updated.assigneeId).toBeNull();
  });

  it("updateTask accepts assigning a member with GitHub in a linked project", async () => {
    mockIssues();
    const row = await insertTask({
      teamId: linked.teamId,
      projectId: linked.projectId,
      creatorId: linked.userId,
    });
    const updated = await TaskService.updateTask(
      row.id,
      { assigneeId: linked.userId },
      linked.userId,
    );
    expect(updated.assigneeId).toBe(linked.userId);
  });

  it("a rejected createTask inserts no row", async () => {
    mockIssues();
    const title = `Rejected ${crypto.randomUUID()}`;
    await expect(
      TaskService.createTask({
        title,
        status: "todo",
        priority: "medium",
        teamId: linked.teamId,
        projectId: linked.projectId,
        assigneeId: memberB,
        creatorId: linked.userId,
      }),
    ).rejects.toBeInstanceOf(TaskAssigneeGithubError);
    const rows = await TaskService.listTasks({ teamId: linked.teamId });
    expect(rows.some((r) => r.title === title)).toBe(false);
  });
});
