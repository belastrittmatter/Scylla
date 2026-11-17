import { describe, expect, it } from "bun:test";
import { db } from "@/db";
import { account, user, project, task } from "@/db/schema";
import { TaskService } from "@/services/task/task-service";
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

describe("TaskWorkspaceService githubConnected flag", () => {
  it(
    "flags users with a github account and not others, on users and assignee",
    async () => {
      const tag = crypto.randomUUID();
      const mk = async (n: string) =>
        (
          await db
            .insert(user)
            .values({
              id: crypto.randomUUID(),
              name: n,
              email: `${n}-${tag}@example.com`,
            })
            .returning()
        )[0];
      const owner = await mk("owner");
      const connected = await mk("conn");
      const plain = await mk("plain");
      const google = await mk("goog");
      await db.insert(account).values([
        {
          id: crypto.randomUUID(),
          accountId: "1",
          providerId: "github",
          userId: connected.id,
          accessToken: "gho_test",
        },
        {
          id: crypto.randomUUID(),
          accountId: "2",
          providerId: "google",
          userId: google.id,
          accessToken: "g_test",
        },
      ]);
      const t = await TeamService.createTeam({
        name: `T ${tag}`,
        ownerId: owner.id,
      });
      for (const u of [connected, plain, google]) {
        await TeamService.addTeamMember({
          teamId: t.id,
          userId: u.id,
          role: "member",
        });
      }
      await TaskService.createTask({
        title: "assigned",
        teamId: t.id,
        creatorId: owner.id,
        assigneeId: connected.id,
        status: "todo",
        priority: "medium",
      });

      const ws = await TaskWorkspaceService.getWorkspaceData(owner.id);
      const flag = (id: string) =>
        ws.users.find((u) => u.id === id)?.githubConnected;
      expect(flag(connected.id)).toBe(true);
      expect(flag(plain.id)).toBe(false);
      expect(flag(google.id)).toBe(false);
      expect(flag(owner.id)).toBe(false);
      expect(ws.tasks[0].assignee?.githubConnected).toBe(true);
      expect(ws.tasks[0].creator?.githubConnected).toBe(false);

      await db
        .delete(user)
        .where(inArray(user.id, [owner.id, connected.id, plain.id, google.id]));
    },
    { timeout: 30000 },
  );
});
