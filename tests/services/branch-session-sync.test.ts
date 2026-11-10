import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { db } from "@/db";
import { user, team, project, account, teamMember } from "@/db/schema";
import { updateTaskAction } from "@/actions/task-actions";
import { TaskService } from "@/services/task/task-service";
import { mockSessionUser } from "../test-utils/mock-session";

describe("Branch Creation Session and Task Action Rules", () => {
  const actingUserId = `acting-user-${Date.now()}`;
  const testUserId = `test-user-${Date.now()}`;
  const testTeamId = `test-team-${Date.now()}`;
  const testProjectId = `test-proj-${Date.now()}`;
  let createdTaskId: string;
  let sessionSpy: ReturnType<typeof mockSessionUser>;

  beforeAll(async () => {
    sessionSpy = mockSessionUser(actingUserId);

    await db
      .insert(user)
      .values([
        {
          id: actingUserId,
          email: `${actingUserId}@example.com`,
          name: "Acting User",
        },
        {
          id: testUserId,
          email: `${testUserId}@example.com`,
          name: "Test User",
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(account)
      .values([
        {
          id: `acc-acting-${Date.now()}`,
          userId: actingUserId,
          providerId: "github",
          accountId: "testgh-acting",
          accessToken: "gho_acting_token",
        },
        {
          id: `acc-${testUserId}`,
          userId: testUserId,
          providerId: "github",
          accountId: "testgh123",
          accessToken: "gho_dummy_token",
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(team)
      .values({
        id: testTeamId,
        name: "Test Team",
        slug: `test-team-${Date.now()}`,
        ownerId: actingUserId,
      })
      .onConflictDoNothing();

    await db
      .insert(teamMember)
      .values([
        {
          id: `tm-acting-${Date.now()}`,
          teamId: testTeamId,
          userId: actingUserId,
          role: "owner",
        },
        {
          id: `tm-test-${Date.now()}`,
          teamId: testTeamId,
          userId: testUserId,
          role: "member",
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(project)
      .values({
        id: testProjectId,
        name: "Test Git Project",
        slug: `test-proj-${Date.now()}`,
        teamId: testTeamId,
        githubRepo: "testorg/testrepo",
      })
      .onConflictDoNothing();

    const created = await TaskService.createTask({
      title: "Test Task for Branch Session",
      teamId: testTeamId,
      projectId: testProjectId,
      creatorId: actingUserId,
      assigneeId: actingUserId,
      status: "todo",
      priority: "medium",
    });
    createdTaskId = created.id;
  });

  test("TaskService.updateTask starts active time tracking session when transitioning to in_progress", async () => {
    const updated = await TaskService.updateTask(
      createdTaskId,
      { status: "in_progress" },
      actingUserId,
    );

    expect(updated.status).toBe("in_progress");
    const sessions = await TaskService.getTaskTimeSessions(createdTaskId);
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0].endedAt).toBeNull();
  });

  test("updateTaskAction blocks invalid transition to in_review when no GitHub branch exists on linked project", async () => {
    const res = await updateTaskAction(createdTaskId, {
      status: "in_review",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("branch");
  });

  afterAll(() => {
    sessionSpy.mockRestore();
  });
});
