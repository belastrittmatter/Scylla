import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { team, user } from "../../src/db/schema";
import { seedDefaultWorkspace } from "../../src/services/task-seed";
import { TeamService } from "../../src/services/team/team-service";
import { TaskService } from "../../src/services/task/task-service";
import { seedDatabase } from "../../src/db/seed";
import { mockSessionUser } from "../test-utils/mock-session";
import {
  getWorkspaceDataAction,
  createTaskAction,
  updateTaskStatusAction,
  updateTaskAction,
  createProjectAction,
  getTaskCommentsAction,
  createTaskCommentAction,
} from "../../src/actions";

describe("Task Server Actions with Core Domain Services", () => {
  let testTeamId: string;
  let testProjectId: string;
  let testTaskId: string;
  const actingUserId = "usr_alex_rivera";
  let session: ReturnType<typeof mockSessionUser>;

  beforeAll(async () => {
    await seedDatabase();
    session = mockSessionUser(actingUserId);
    await seedDefaultWorkspace(actingUserId);
    const tempTeam = await TeamService.createTeam({
      name: `Action Test Team ${Date.now()}`,
      slug: `action-test-team-${Date.now()}`,
      ownerId: actingUserId,
    });
    testTeamId = tempTeam.id;
  });

  afterAll(async () => {
    session?.mockRestore();
    if (testTeamId) {
      await TeamService.deleteTeam(testTeamId);
    }
  });

  test("getWorkspaceDataAction returns initial seeded workspace data", async () => {
    const res = await getWorkspaceDataAction();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.teams.length).toBeGreaterThan(0);
    expect(res.data!.projects.length).toBeGreaterThan(0);
    expect(res.data!.tasks.length).toBeGreaterThan(0);
  });

  test("createProjectAction creates project via ProjectService", async () => {
    const res = await createProjectAction({
      teamId: testTeamId,
      name: `Action Project ${Date.now()}`,
      description: "Test project via action",
      color: "#6366f1",
    });

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.teamId).toBe(testTeamId);
    expect(res.data!.status).toBe("active");
    testProjectId = res.data!.id;
  });

  test("createTaskAction, updateTaskStatusAction, updateTaskAction lifecycle via TaskService", async () => {
    // 1. Create task
    const createRes = await createTaskAction({
      title: `Task Lifecycle ${Date.now()}`,
      description: "Action test description",
      status: "todo",
      priority: "urgent",
      teamId: testTeamId,
      projectId: testProjectId,
    });
    expect(createRes.success).toBe(true);
    const createdTask = createRes.data!;
    expect(createdTask.title).toContain("Task Lifecycle");
    expect(createdTask.status).toBe("todo");
    testTaskId = createdTask.id;

    // 2. Update status
    const statusRes = await updateTaskStatusAction(
      createdTask.id,
      "in_progress",
    );
    expect(statusRes.success).toBe(true);
    expect(statusRes.data!.status).toBe("in_progress");

    // 3. Update details
    const updateRes = await updateTaskAction(createdTask.id, {
      title: "Updated Task Title",
      priority: "high",
    });
    expect(updateRes.success).toBe(true);
    expect(updateRes.data!.title).toBe("Updated Task Title");
    expect(updateRes.data!.priority).toBe("high");
  });

  test("createTaskAction accepts a team slug and stores the real team id", async () => {
    const own = await TeamService.getTeamById(testTeamId);
    const res = await createTaskAction({
      teamId: own!.slug,
      title: `Slug Task ${Date.now()}`,
    });
    expect(res.success).toBe(true);
    expect(res.data!.teamId).toBe(testTeamId);
  });

  test("createTaskCommentAction and getTaskCommentsAction comments flow", async () => {
    const commentRes = await createTaskCommentAction({
      taskId: testTaskId,
      content: "Automated test comment content",
    });
    expect(commentRes.success).toBe(true);
    expect(commentRes.data!.content).toBe("Automated test comment content");

    const listRes = await getTaskCommentsAction(testTaskId);
    expect(listRes.success).toBe(true);
    expect(
      listRes.data!.some((c) => c.content === "Automated test comment content"),
    ).toBe(true);
  });

  describe("Security: Workspace and Team Authorization Guards (#93)", () => {
    let foreignTeamId: string;
    let foreignTaskId: string;
    let foreignUserId: string;

    beforeAll(async () => {
      const [foreignUser] = await db
        .insert(user)
        .values({
          id: `usr_foreign_${Date.now()}`,
          name: "Foreign User",
          email: `foreign-${Date.now()}@example.com`,
        })
        .returning();
      foreignUserId = foreignUser.id;

      const fTeam = await TeamService.createTeam({
        name: `Foreign Team ${Date.now()}`,
        slug: `foreign-team-${Date.now()}`,
        ownerId: foreignUserId,
      });
      foreignTeamId = fTeam.id;

      const fTask = await TaskService.createTask({
        title: "Foreign Secret Task",
        teamId: foreignTeamId,
        creatorId: foreignUserId,
        status: "todo",
        priority: "medium",
      });
      foreignTaskId = fTask.id;
    });

    afterAll(async () => {
      if (foreignTeamId) {
        await TeamService.deleteTeam(foreignTeamId);
      }
      if (foreignUserId) {
        await db.delete(user).where(eq(user.id, foreignUserId));
      }
    });

    test("createProjectAction rejects non-members", async () => {
      const res = await createProjectAction({
        teamId: foreignTeamId,
        name: "Unauthorized Project",
      });
      expect(res).toEqual({ success: false, error: "Access denied" });
    });

    test("createTaskAction rejects non-members", async () => {
      const res = await createTaskAction({
        teamId: foreignTeamId,
        title: "Unauthorized Task",
        status: "todo",
      });
      expect(res).toEqual({ success: false, error: "Access denied" });
    });

    test("updateTaskAction rejects non-members", async () => {
      const res = await updateTaskAction(foreignTaskId, {
        title: "Hacked Task Title",
      });
      expect(res).toEqual({ success: false, error: "Access denied" });
    });

    test("updateTaskStatusAction rejects non-members", async () => {
      const res = await updateTaskStatusAction(foreignTaskId, "done");
      expect(res).toEqual({ success: false, error: "Access denied" });
    });

    test("getTaskCommentsAction rejects non-members", async () => {
      const res = await getTaskCommentsAction(foreignTaskId);
      expect(res).toEqual({ success: false, error: "Access denied" });
    });

    test("createTaskCommentAction rejects non-members", async () => {
      const res = await createTaskCommentAction({
        taskId: foreignTaskId,
        content: "Unauthorized comment",
      });
      expect(res).toEqual({ success: false, error: "Access denied" });
    });

    test("createTaskAction rejects an assignee outside the team", async () => {
      const res = await createTaskAction({
        teamId: testTeamId,
        title: "Assigned to outsider",
        assigneeId: foreignUserId,
      });
      expect(res).toEqual({
        success: false,
        error: "Assignee must be a member of the team",
      });
    });

    test("updateTaskAction rejects an assignee outside the team", async () => {
      const res = await updateTaskAction(testTaskId, {
        assigneeId: foreignUserId,
      });
      expect(res).toEqual({
        success: false,
        error: "Assignee must be a member of the team",
      });
    });

    test("updateTaskAction accepts a member assignee and unassigning", async () => {
      const assigned = await updateTaskAction(testTaskId, {
        assigneeId: actingUserId,
      });
      expect(assigned.success).toBe(true);
      expect(assigned.data!.assigneeId).toBe(actingUserId);

      const cleared = await updateTaskAction(testTaskId, { assigneeId: null });
      expect(cleared.success).toBe(true);
      expect(cleared.data!.assigneeId).toBeNull();
    });

    test("update actions fail closed without a session and leave the task untouched", async () => {
      session.mockRestore();
      try {
        const before = await TaskService.getTaskById(testTaskId);
        const update = await updateTaskAction(testTaskId, { title: "Anon" });
        const status = await updateTaskStatusAction(testTaskId, "done");
        for (const res of [update, status]) {
          expect(res).toEqual({
            success: false,
            error: "Unauthorized: Active user session required",
          });
        }
        const after = await TaskService.getTaskById(testTaskId);
        expect(after!.title).toBe(before!.title);
        expect(after!.status).toBe(before!.status);
      } finally {
        session = mockSessionUser(actingUserId);
      }
    });

    describe("team slug that equals another team's id", () => {
      let shadowTeamId: string;

      beforeAll(async () => {
        const shadow = await TeamService.createTeam({
          name: `Shadow Team ${Date.now()}`,
          ownerId: actingUserId,
        });
        shadowTeamId = shadow.id;
        // createTeam rejects UUID-shaped slugs; write one directly to model a legacy row.
        await db
          .update(team)
          .set({ slug: foreignTeamId })
          .where(eq(team.id, shadowTeamId));
      });

      afterAll(async () => {
        if (shadowTeamId) await TeamService.deleteTeam(shadowTeamId);
      });

      test("resolveTeamId prefers the real id over a colliding slug", async () => {
        expect(await TeamService.resolveTeamId(foreignTeamId)).toBe(
          foreignTeamId,
        );
      });

      test("isTeamMember only matches by id", async () => {
        expect(
          await TeamService.isTeamMember(foreignTeamId, actingUserId),
        ).toBe(false);
      });

      test("createTaskAction cannot write into the victim team", async () => {
        const res = await createTaskAction({
          teamId: foreignTeamId,
          title: "Slug collision task",
        });
        expect(res).toEqual({ success: false, error: "Access denied" });
      });

      test("createProjectAction cannot write into the victim team", async () => {
        const res = await createProjectAction({
          teamId: foreignTeamId,
          name: "Slug collision project",
        });
        expect(res).toEqual({ success: false, error: "Access denied" });
      });
    });
  });

  describe("Security: viewers are read-only (#99)", () => {
    const ownerId = `usr_viewer_owner_${Date.now()}`;
    let viewerTeamId: string;
    let viewerTaskId: string;

    beforeAll(async () => {
      await db.insert(user).values({
        id: ownerId,
        name: "Owner",
        email: `${ownerId}@example.com`,
      });
      const t = await TeamService.createTeam({
        name: `Viewer Team ${Date.now()}`,
        slug: `viewer-team-${Date.now()}`,
        ownerId,
      });
      viewerTeamId = t.id;
      await TeamService.addTeamMember({
        teamId: viewerTeamId,
        userId: actingUserId,
        role: "viewer",
      });
      const task = await TaskService.createTask({
        title: "Viewer-visible task",
        teamId: viewerTeamId,
        creatorId: ownerId,
        status: "todo",
        priority: "medium",
      });
      viewerTaskId = task.id;
    });

    afterAll(async () => {
      if (viewerTeamId) await TeamService.deleteTeam(viewerTeamId);
      await db.delete(user).where(eq(user.id, ownerId));
    });

    test("createProjectAction requires admin (viewer and member denied)", async () => {
      for (const role of ["viewer", "member"] as const) {
        await TeamService.updateMemberRole(
          viewerTeamId,
          actingUserId,
          role,
          ownerId,
        );
        const res = await createProjectAction({
          teamId: viewerTeamId,
          name: `${role} project`,
        });
        expect(res.success).toBe(false);
        expect(res.error).toMatch(/admin role required/);
      }

      await TeamService.updateMemberRole(
        viewerTeamId,
        actingUserId,
        "admin",
        ownerId,
      );
      const admin = await createProjectAction({
        teamId: viewerTeamId,
        name: "Admin project",
      });
      expect(admin.success).toBe(true);

      await TeamService.updateMemberRole(
        viewerTeamId,
        actingUserId,
        "viewer",
        ownerId,
      );
    });

    test("createTaskCommentAction rejects viewers", async () => {
      const res = await createTaskCommentAction({
        taskId: viewerTaskId,
        content: "Viewer comment",
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/viewer/i);
    });
  });
});
