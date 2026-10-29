import { describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "../../src/db";
import { user } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";
import { ProjectService } from "../../src/services/project/project-service";
import { TaskService } from "../../src/services/task/task-service";

describe("TaskService Domain Logic", () => {
  test("creates, lists, updates, and filters tasks", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Task Worker",
        email: `task-worker-${Date.now()}@example.com`,
      })
      .returning();

    const newTeam = await TeamService.createTeam({
      name: `Task Team ${Date.now()}`,
      ownerId: testUser.id,
    });

    const newProject = await ProjectService.createProject({
      name: "Task Core Project",
      teamId: newTeam.id,
    });

    // Create task
    const newTask = await TaskService.createTask({
      title: "Write integration tests",
      description: "Cover all edge cases for task service",
      teamId: newTeam.id,
      projectId: newProject.id,
      creatorId: testUser.id,
      assigneeId: testUser.id,
      status: "todo",
      priority: "high",
      dueDate: new Date(Date.now() + 86400000), // tomorrow
    });

    expect(newTask.id).toBeDefined();
    expect(newTask.title).toBe("Write integration tests");
    expect(newTask.position).toBe(0);

    // Fetch by ID with relations
    const fetched = await TaskService.getTaskById(newTask.id);
    expect(fetched?.id).toBe(newTask.id);
    expect(fetched?.creator?.id).toBe(testUser.id);
    expect(fetched?.assignee?.id).toBe(testUser.id);
    expect(fetched?.project?.id).toBe(newProject.id);

    // Update status
    const inProgressTask = await TaskService.updateTask(newTask.id, {
      status: "in_progress",
    });
    expect(inProgressTask.status).toBe("in_progress");

    // List tasks
    const tasks = await TaskService.listTasks({
      teamId: newTeam.id,
      projectId: newProject.id,
      status: "in_progress",
    });
    expect(tasks.length).toBe(1);

    // Delete task
    const deleted = await TaskService.deleteTask(newTask.id);
    expect(deleted).toBe(true);

    // Clean up
    await db.delete(user).where(inArray(user.id, [testUser.id]));
  });

  test("fails to create task with non-existent teamId", async () => {
    await expect(
      TaskService.createTask({
        title: "Orphan Task",
        teamId: "non-existent-team-id",
        creatorId: "usr_test",
        status: "todo",
        priority: "medium",
      }),
    ).rejects.toThrow('Team with id "non-existent-team-id" not found');
  });

  test("fails to create task with non-existent projectId", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Task User",
        email: `task-user-${Date.now()}@example.com`,
      })
      .returning();

    const newTeam = await TeamService.createTeam({
      name: `Team ${Date.now()}`,
      ownerId: testUser.id,
    });

    await expect(
      TaskService.createTask({
        title: "Invalid Project Task",
        teamId: newTeam.id,
        projectId: "non-existent-project-id",
        creatorId: testUser.id,
        status: "todo",
        priority: "medium",
      }),
    ).rejects.toThrow(
      'Project with id "non-existent-project-id" not found in team',
    );

    await db.delete(user).where(inArray(user.id, [testUser.id]));
  });

  test("fails to create task with projectId from another team", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Task User 2",
        email: `task-user-2-${Date.now()}@example.com`,
      })
      .returning();

    const teamA = await TeamService.createTeam({
      name: `Team A ${Date.now()}`,
      ownerId: testUser.id,
    });

    const teamB = await TeamService.createTeam({
      name: `Team B ${Date.now()}`,
      ownerId: testUser.id,
    });

    const projectB = await ProjectService.createProject({
      name: "Project in Team B",
      teamId: teamB.id,
    });

    await expect(
      TaskService.createTask({
        title: "Cross Team Task",
        teamId: teamA.id,
        projectId: projectB.id,
        creatorId: testUser.id,
        status: "todo",
        priority: "medium",
      }),
    ).rejects.toThrow(
      `Project with id "${projectB.id}" not found in team "${teamA.id}"`,
    );

    await db.delete(user).where(inArray(user.id, [testUser.id]));
  });

  test("tracks time session when moving to in_progress and discards spam movements (< 1 minute)", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Time Tracker",
        email: `time-tracker-${Date.now()}@example.com`,
      })
      .returning();

    const newTeam = await TeamService.createTeam({
      name: `Time Team ${Date.now()}`,
      ownerId: testUser.id,
    });

    // 1. Create task with custom estimatedMinutes
    const task = await TaskService.createTask({
      title: "Time tracked task",
      teamId: newTeam.id,
      creatorId: testUser.id,
      status: "todo",
      priority: "medium",
      estimatedMinutes: 90,
    });

    expect(task.estimatedMinutes).toBe(90);

    // 2. Move to in_progress -> starts session
    await TaskService.updateTask(
      task.id,
      { status: "in_progress" },
      testUser.id,
    );
    let sessions = await TaskService.getTaskTimeSessions(task.id);
    expect(sessions.length).toBe(1);
    expect(sessions[0].endedAt).toBeNull();

    // 3. Move back to todo immediately (< 1 minute spam drag) -> session is discarded
    await TaskService.updateTask(task.id, { status: "todo" }, testUser.id);
    sessions = await TaskService.getTaskTimeSessions(task.id);
    expect(sessions.length).toBe(0); // Discarded spam session!

    // 4. Move to in_progress again, but simulate session lasting only 30 seconds (< 60s threshold)
    await TaskService.updateTask(
      task.id,
      { status: "in_progress" },
      testUser.id,
    );
    sessions = await TaskService.getTaskTimeSessions(task.id);
    expect(sessions.length).toBe(1);
    const shortSession = sessions[0];

    const { taskTimeSession } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");

    // Age startedAt by 30 seconds (30s < 60s threshold)
    await db
      .update(taskTimeSession)
      .set({ startedAt: new Date(Date.now() - 30000) })
      .where(eq(taskTimeSession.id, shortSession.id));

    // Move to todo -> still discarded because < 1 minute
    await TaskService.updateTask(task.id, { status: "todo" }, testUser.id);
    sessions = await TaskService.getTaskTimeSessions(task.id);
    expect(sessions.length).toBe(0);

    // 5. Move to in_progress again, simulate valid work session lasting 90 seconds (>= 60s)
    await TaskService.updateTask(
      task.id,
      { status: "in_progress" },
      testUser.id,
    );
    sessions = await TaskService.getTaskTimeSessions(task.id);
    expect(sessions.length).toBe(1);
    const validSession = sessions[0];

    // Verify active session startedAt is not shifted by local timezone offset (e.g. UTC+7)
    const origTz = process.env.TZ;
    process.env.TZ = "Asia/Bangkok";
    try {
      const { TaskWorkspaceService } =
        await import("../../src/services/task/task-workspace-service");
      const activeWs = await TaskWorkspaceService.getWorkspaceData();
      const activeTask = activeWs.tasks.find((t) => t.id === task.id);
      expect(activeTask?.activeSessionStartedAt).not.toBeNull();
      const diffMs = Math.abs(
        Date.now() - new Date(activeTask!.activeSessionStartedAt!).getTime(),
      );
      expect(diffMs).toBeLessThan(10000); // within 10s of now, NOT 7 hours (25,200,000ms)
    } finally {
      process.env.TZ = origTz;
    }

    // Age startedAt by 90 seconds (90s >= 60s)
    await db
      .update(taskTimeSession)
      .set({ startedAt: new Date(Date.now() - 90000) })
      .where(eq(taskTimeSession.id, validSession.id));

    // Now move task to done -> session is preserved and closed
    await TaskService.updateTask(task.id, { status: "done" }, testUser.id);
    sessions = await TaskService.getTaskTimeSessions(task.id);
    expect(sessions.length).toBe(1);
    expect(sessions[0].endedAt).not.toBeNull();
    expect(sessions[0].durationSeconds).toBeGreaterThanOrEqual(89);

    // Verify workspace aggregation
    const { TaskWorkspaceService } =
      await import("../../src/services/task/task-workspace-service");
    const wsData = await TaskWorkspaceService.getWorkspaceData();
    const wsTask = wsData.tasks.find((t) => t.id === task.id);
    expect(wsTask?.totalSpentSeconds).toBeGreaterThanOrEqual(89);
    expect(wsTask?.activeSessionStartedAt).toBeNull();

    // Clean up
    await TaskService.deleteTask(task.id);
    await db.delete(user).where(inArray(user.id, [testUser.id]));
  });
});
