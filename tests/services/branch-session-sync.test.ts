import { describe, expect, test, beforeAll } from "bun:test";
import { db } from "@/db";
import { user, team, project, account } from "@/db/schema";
import { updateTaskAction } from "@/actions/task-actions";
import { resolveActionUserId } from "@/actions/auth-helper";
import { TaskService } from "@/services/task/task-service";

describe("Branch Creation Session and Task Action Rules", () => {
  const testUserId = `test-user-${Date.now()}`;
  const testTeamId = `test-team-${Date.now()}`;
  const testProjectId = `test-proj-${Date.now()}`;
  let createdTaskId: string;

  beforeAll(async () => {
    const actingUserId = await resolveActionUserId();

    await db
      .insert(account)
      .values({
        id: `acc-acting-${Date.now()}`,
        userId: actingUserId,
        providerId: "github",
        accountId: "testgh-acting",
        accessToken: "gho_acting_token",
      })
      .onConflictDoNothing();

    await db
      .insert(user)
      .values({
        id: testUserId,
        email: `${testUserId}@example.com`,
        name: "Test User",
      })
      .onConflictDoNothing();

    await db
      .insert(account)
      .values({
        id: `acc-${testUserId}`,
        userId: testUserId,
        providerId: "github",
        accountId: "testgh123",
        accessToken: "gho_dummy_token",
      })
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
      testUserId,
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
});
