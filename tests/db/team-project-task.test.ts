import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { user, team, teamMember, project, task } from "../../src/db/schema";

describe("Team, Project, and Task Schema & Relations", () => {
  test("creates a team with an owner and team members", async () => {
    // 1. Get or create test users
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Team Owner",
        email: `owner-${Date.now()}@example.com`,
      })
      .returning();

    const [testMember] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Team Member",
        email: `member-${Date.now()}@example.com`,
      })
      .returning();

    expect(testOwner).toBeDefined();
    expect(testMember).toBeDefined();

    // 2. Insert team
    const teamSlug = `eng-team-${Date.now()}`;
    const [newTeam] = await db
      .insert(team)
      .values({
        name: "Engineering Core",
        slug: teamSlug,
        description: "Core engineering & platform infrastructure team",
        ownerId: testOwner.id,
      })
      .returning();

    expect(newTeam.id).toBeDefined();
    expect(newTeam.slug).toBe(teamSlug);
    expect(newTeam.ownerId).toBe(testOwner.id);

    // 3. Add members to the team
    const [ownerMembership] = await db
      .insert(teamMember)
      .values({
        teamId: newTeam.id,
        userId: testOwner.id,
        role: "owner",
      })
      .returning();

    const [regularMembership] = await db
      .insert(teamMember)
      .values({
        teamId: newTeam.id,
        userId: testMember.id,
        role: "member",
      })
      .returning();

    expect(ownerMembership.role).toBe("owner");
    expect(regularMembership.role).toBe("member");

    // 3b. Verify unique constraint: duplicate (teamId, userId) membership is rejected
    await expect(
      db
        .insert(teamMember)
        .values({
          teamId: newTeam.id,
          userId: testMember.id,
          role: "admin",
        })
        .execute()
    ).rejects.toThrow();

    // 4. Create a project under the team
    const projectSlug = `mcp-bridge-${Date.now()}`;
    const [newProject] = await db
      .insert(project)
      .values({
        name: "MCP Client Protocol Bridge",
        slug: projectSlug,
        description: "Implementation of MCP 2026 specs and tool bridges",
        teamId: newTeam.id,
        status: "active",
        color: "#3b82f6",
      })
      .returning();

    expect(newProject.id).toBeDefined();
    expect(newProject.teamId).toBe(newTeam.id);
    expect(newProject.status).toBe("active");

    // 4b. Verify unique constraint: duplicate (teamId, slug) in the same team is rejected
    await expect(
      db
        .insert(project)
        .values({
          name: "Conflicting Slug Project",
          slug: projectSlug,
          teamId: newTeam.id,
          status: "planning",
        })
        .execute()
    ).rejects.toThrow();

    // 5. Create a task under the project and team
    const [newTask] = await db
      .insert(task)
      .values({
        title: "Implement MCP Tasks Tool Handler",
        description: "Expose task start, status, and cancel tools for long-running workflows",
        status: "todo",
        priority: "high",
        projectId: newProject.id,
        teamId: newTeam.id,
        creatorId: testOwner.id,
        assigneeId: testMember.id,
        position: 1,
        dueDate: new Date(Date.now() + 86400000 * 7),
      })
      .returning();

    expect(newTask.id).toBeDefined();
    expect(newTask.title).toBe("Implement MCP Tasks Tool Handler");
    expect(newTask.status).toBe("todo");
    expect(newTask.priority).toBe("high");
    expect(newTask.assigneeId).toBe(testMember.id);
    expect(newTask.creatorId).toBe(testOwner.id);

    // 6. Test Drizzle ORM Relations query
    const queriedTeam = await db.query.team.findFirst({
      where: eq(team.id, newTeam.id),
      with: {
        owner: true,
        members: {
          with: {
            user: true,
          },
        },
        projects: {
          with: {
            tasks: true,
          },
        },
        tasks: true,
      },
    });

    expect(queriedTeam).toBeDefined();
    expect(queriedTeam?.owner.id).toBe(testOwner.id);
    expect(queriedTeam?.members.length).toBe(2);
    expect(queriedTeam?.projects.length).toBe(1);
    expect(queriedTeam?.projects[0].tasks.length).toBe(1);
    expect(queriedTeam?.projects[0].tasks[0].id).toBe(newTask.id);

    // 7. Test task relations query (with project, team, creator, assignee)
    const queriedTask = await db.query.task.findFirst({
      where: eq(task.id, newTask.id),
      with: {
        project: true,
        team: true,
        creator: true,
        assignee: true,
      },
    });

    expect(queriedTask).toBeDefined();
    expect(queriedTask?.project?.id).toBe(newProject.id);
    expect(queriedTask?.team.id).toBe(newTeam.id);
    expect(queriedTask?.creator.id).toBe(testOwner.id);
    expect(queriedTask?.assignee?.id).toBe(testMember.id);

    // 8. Test Cascade Deletion: Deleting team cascades to members, projects, and tasks
    await db.delete(team).where(eq(team.id, newTeam.id));

    const remainingProjects = await db.select().from(project).where(eq(project.id, newProject.id));
    const remainingTasks = await db.select().from(task).where(eq(task.id, newTask.id));
    const remainingMembers = await db
      .select()
      .from(teamMember)
      .where(eq(teamMember.teamId, newTeam.id));

    expect(remainingProjects.length).toBe(0);
    expect(remainingTasks.length).toBe(0);
    expect(remainingMembers.length).toBe(0);

    // Clean up test users
    await db.delete(user).where(eq(user.id, testOwner.id));
    await db.delete(user).where(eq(user.id, testMember.id));
  });
});
