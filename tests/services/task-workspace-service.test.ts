import { describe, expect, it } from "bun:test";
import { db } from "@/db";
import { user, project, task } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { TeamService } from "@/services/team/team-service";
import { TaskWorkspaceService } from "@/services/task/task-workspace-service";

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
