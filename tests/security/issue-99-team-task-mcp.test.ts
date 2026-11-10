import { describe, expect, test } from "bun:test";
import { db } from "@/db";
import { user, eventType } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TeamService } from "@/services/team/team-service";
import { ProjectService } from "@/services/project/project-service";
import { TaskService } from "@/services/task/task-service";
import { POST as createBookingHandler } from "@/app/api/bookings/route";
import {
  PATCH as updateMemberRoleHandler,
  DELETE as removeMemberHandler,
} from "@/app/api/teams/[id]/members/[userId]/route";
import { POST as addMemberHandler } from "@/app/api/teams/[id]/members/route";
import { resolveTeamAndVerifyAccess } from "@/mcp/tools/auth-helpers";

describe("Issue #99 Authorization & Hardening", () => {
  test("C1: TaskService rejects cross-team projectId and non-member assigneeId", async () => {
    const [ownerA] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Owner A",
        email: `owner-a-${Date.now()}@example.com`,
      })
      .returning();

    const [ownerB] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Owner B",
        email: `owner-b-${Date.now()}@example.com`,
      })
      .returning();

    const teamA = await TeamService.createTeam({
      name: `Team A ${Date.now()}`,
      ownerId: ownerA.id,
    });

    const teamB = await TeamService.createTeam({
      name: `Team B ${Date.now()}`,
      ownerId: ownerB.id,
    });

    const projectA = await ProjectService.createProject({
      name: "Project A",
      teamId: teamA.id,
    });

    const projectB = await ProjectService.createProject({
      name: "Project B",
      teamId: teamB.id,
    });

    const taskA = await TaskService.createTask({
      title: "Task in Team A",
      status: "todo",
      priority: "medium",
      teamId: teamA.id,
      projectId: projectA.id,
      creatorId: ownerA.id,
    });

    // Cross-team project assignment in updateTask must be rejected
    await expect(
      TaskService.updateTask(taskA.id, { projectId: projectB.id }, ownerA.id),
    ).rejects.toThrow(/not found in team/);

    // Non-member assignee assignment in createTask must be rejected
    await expect(
      TaskService.createTask({
        title: "Task with non-member assignee",
        status: "todo",
        priority: "medium",
        teamId: teamA.id,
        projectId: projectA.id,
        creatorId: ownerA.id,
        assigneeId: ownerB.id,
      }),
    ).rejects.toThrow(/not a member of team/);

    // Non-member assignee assignment in updateTask must be rejected
    await expect(
      TaskService.updateTask(taskA.id, { assigneeId: ownerB.id }, ownerA.id),
    ).rejects.toThrow(/not a member of team/);
  });

  test("C2: POST /api/bookings validates foreign project, non-existent room, and foreign eventType", async () => {
    const [organizer] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Booking Organizer",
        email: `organizer-${Date.now()}@example.com`,
      })
      .returning();

    const [stranger] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Stranger",
        email: `stranger-${Date.now()}@example.com`,
      })
      .returning();

    const strangerTeam = await TeamService.createTeam({
      name: `Stranger Team ${Date.now()}`,
      ownerId: stranger.id,
    });

    const foreignProject = await ProjectService.createProject({
      name: "Stranger Project",
      teamId: strangerTeam.id,
    });

    const [foreignEventType] = await db
      .insert(eventType)
      .values({
        name: "Stranger Event",
        title: "Stranger Event",
        slug: `stranger-event-${Date.now()}`,
        duration: 30,
        userId: stranger.id,
      })
      .returning();

    try {
      // 0. The x-user-id header is never a source of identity
      const reqHeaderOnly = new Request("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": organizer.id,
        },
        body: JSON.stringify({
          title: "Header-only identity",
          startTime: new Date(Date.now() + 3600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
          attendees: [{ email: "guest@example.com", name: "Guest" }],
        }),
      });
      expect((await createBookingHandler(reqHeaderOnly)).status).toBe(401);

      // 1. Rejects foreign project where organizer is not a team member
      const reqForeignProject = new Request(
        "http://localhost:3000/api/bookings",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            title: "Meeting with foreign project",
            startTime: new Date(Date.now() + 3600000).toISOString(),
            endTime: new Date(Date.now() + 7200000).toISOString(),
            attendees: [{ email: "guest@example.com", name: "Guest" }],
            organizerUserId: organizer.id,
            projectId: foreignProject.id,
          }),
        },
      );
      const resForeignProject = await createBookingHandler(reqForeignProject);
      expect(resForeignProject.status).toBe(403);

      // 2. Rejects non-existent room
      const reqInvalidRoom = new Request("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Meeting with fake room",
          startTime: new Date(Date.now() + 3600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
          attendees: [{ email: "guest@example.com", name: "Guest" }],
          organizerUserId: organizer.id,
          roomId: "room_non_existent_uuid",
        }),
      });
      const resInvalidRoom = await createBookingHandler(reqInvalidRoom);
      expect(resInvalidRoom.status).toBe(400);

      // 3. Rejects foreign eventType
      const reqForeignEventType = new Request(
        "http://localhost:3000/api/bookings",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            title: "Meeting with foreign event type",
            startTime: new Date(Date.now() + 3600000).toISOString(),
            endTime: new Date(Date.now() + 7200000).toISOString(),
            attendees: [{ email: "guest@example.com", name: "Guest" }],
            organizerUserId: organizer.id,
            eventTypeId: foreignEventType.id,
          }),
        },
      );
      const resForeignEventType =
        await createBookingHandler(reqForeignEventType);
      expect(resForeignEventType.status).toBe(403);
    } finally {
      // A leftover event type breaks the seed test on the next run.
      await db.delete(eventType).where(eq(eventType.id, foreignEventType.id));
    }
  });

  test("C3: Team member routes prevent role escalation", async () => {
    const [teamOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Team Owner",
        email: `team-owner-${Date.now()}@example.com`,
      })
      .returning();

    const [adminUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Admin User",
        email: `admin-user-${Date.now()}@example.com`,
      })
      .returning();

    const [targetMember] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Target Member",
        email: `member-${Date.now()}@example.com`,
      })
      .returning();

    const testTeam = await TeamService.createTeam({
      name: `Security Team ${Date.now()}`,
      ownerId: teamOwner.id,
    });

    await TeamService.addTeamMember({
      teamId: testTeam.id,
      userId: adminUser.id,
      role: "admin",
    });

    await TeamService.addTeamMember({
      teamId: testTeam.id,
      userId: targetMember.id,
      role: "member",
    });

    // 1. Admin cannot assign owner role via PATCH
    const reqPromoteOwner = new Request(
      `http://localhost:3000/api/teams/${testTeam.id}/members/${targetMember.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-user-id": adminUser.id,
        },
        body: JSON.stringify({ role: "owner" }),
      },
    );
    const resPromoteOwner = await updateMemberRoleHandler(reqPromoteOwner, {
      params: { id: testTeam.id, userId: targetMember.id },
    });
    expect(resPromoteOwner.status).toBe(403);

    // 2. Admin cannot add a new member with owner role via POST
    const reqAddOwner = new Request(
      `http://localhost:3000/api/teams/${testTeam.id}/members`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": adminUser.id,
        },
        body: JSON.stringify({
          userId: targetMember.id,
          role: "owner",
        }),
      },
    );
    const resAddOwner = await addMemberHandler(reqAddOwner, {
      params: { id: testTeam.id },
    });
    expect(resAddOwner.status).toBe(403);

    // 3. Admin cannot demote team owner
    const reqDemoteOwner = new Request(
      `http://localhost:3000/api/teams/${testTeam.id}/members/${teamOwner.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-user-id": adminUser.id,
        },
        body: JSON.stringify({ role: "member" }),
      },
    );
    const resDemoteOwner = await updateMemberRoleHandler(reqDemoteOwner, {
      params: { id: testTeam.id, userId: teamOwner.id },
    });
    expect(resDemoteOwner.status).toBe(403);

    // 4. Admin cannot remove other admin
    const [otherAdmin] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Other Admin",
        email: `other-admin-${Date.now()}@example.com`,
      })
      .returning();

    await TeamService.addTeamMember({
      teamId: testTeam.id,
      userId: otherAdmin.id,
      role: "admin",
    });

    const reqRemoveAdmin = new Request(
      `http://localhost:3000/api/teams/${testTeam.id}/members/${otherAdmin.id}`,
      {
        method: "DELETE",
        headers: { "x-user-id": adminUser.id },
      },
    );
    const resRemoveAdmin = await removeMemberHandler(reqRemoveAdmin, {
      params: { id: testTeam.id, userId: otherAdmin.id },
    });
    expect(resRemoveAdmin.status).toBe(403);
  });

  test("C4: Viewer role is enforced as read-only across tasks and projects", async () => {
    const [teamOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Viewer Test Owner",
        email: `viewer-owner-${Date.now()}@example.com`,
      })
      .returning();

    const [viewerUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Viewer User",
        email: `viewer-user-${Date.now()}@example.com`,
      })
      .returning();

    const testTeam = await TeamService.createTeam({
      name: `Viewer Team ${Date.now()}`,
      ownerId: teamOwner.id,
    });

    await TeamService.addTeamMember({
      teamId: testTeam.id,
      userId: viewerUser.id,
      role: "viewer",
    });

    const project = await ProjectService.createProject({
      name: "Team Project",
      teamId: testTeam.id,
    });

    const task = await TaskService.createTask({
      title: "Owner task",
      status: "todo",
      priority: "medium",
      teamId: testTeam.id,
      projectId: project.id,
      creatorId: teamOwner.id,
    });

    // 1. Viewer cannot create task
    await expect(
      TaskService.createTask({
        title: "Viewer created task",
        status: "todo",
        priority: "medium",
        teamId: testTeam.id,
        projectId: project.id,
        creatorId: viewerUser.id,
      }),
    ).rejects.toThrow(/Viewer role cannot create tasks/);

    // 2. Viewer cannot update task
    await expect(
      TaskService.updateTask(task.id, { title: "Hacked title" }, viewerUser.id),
    ).rejects.toThrow(/Viewer role cannot update tasks/);

    // 3. Viewer cannot delete task
    expect(await TaskService.getWriteAccess(task, viewerUser.id)).toBe(
      "forbidden",
    );

    // 4. MCP resolveTeamAndVerifyAccess with member role rejects viewer
    await expect(
      resolveTeamAndVerifyAccess(testTeam.id, viewerUser.id, "member"),
    ).rejects.toThrow(/viewer is read-only/);
  });

  test("C5: Disallow UUID-shaped slugs and prevent UUID vs slug collision", async () => {
    const [teamOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Slug Owner",
        email: `slug-owner-${Date.now()}@example.com`,
      })
      .returning();

    const fakeUuid = crypto.randomUUID();

    // createTeam rejects UUID-shaped slug
    await expect(
      TeamService.createTeam({
        name: "Bad Slug Team",
        slug: fakeUuid,
        ownerId: teamOwner.id,
      }),
    ).rejects.toThrow(/cannot be formatted as a UUID/);

    const normalTeam = await TeamService.createTeam({
      name: `Normal Slug Team ${Date.now()}`,
      ownerId: teamOwner.id,
    });

    // updateTeam rejects UUID-shaped slug
    await expect(
      TeamService.updateTeam(normalTeam.id, {
        slug: fakeUuid,
      }),
    ).rejects.toThrow(/cannot be formatted as a UUID/);
  });
});
