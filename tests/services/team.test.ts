import { describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "../../src/db";
import { user } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";

describe("TeamService Domain Logic", () => {
  test("creates a team and verifies owner membership", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Service Team Owner",
        email: `owner-service-${Date.now()}@example.com`,
      })
      .returning();

    const teamName = `Eng Service Team ${Date.now()}`;
    const newTeam = await TeamService.createTeam({
      name: teamName,
      description: "Platform core team",
      ownerId: testOwner.id,
    });

    expect(newTeam.id).toBeDefined();
    expect(newTeam.name).toBe(teamName);
    expect(newTeam.ownerId).toBe(testOwner.id);

    // Verify team lookup with members
    const fetched = await TeamService.getTeamById(newTeam.id);
    expect(fetched).toBeDefined();
    expect(fetched?.members.length).toBe(1);
    expect(fetched?.members[0].userId).toBe(testOwner.id);
    expect(fetched?.members[0].role).toBe("owner");

    // Add a new member
    const [testMember] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Service Team Member",
        email: `member-service-${Date.now()}@example.com`,
      })
      .returning();

    const addedMember = await TeamService.addTeamMember({
      teamId: newTeam.id,
      userId: testMember.id,
      role: "member",
    });

    expect(addedMember.role).toBe("member");

    // List user teams
    const userTeams = await TeamService.listUserTeams(testMember.id);
    expect(userTeams.some((t) => t.id === newTeam.id)).toBe(true);

    // Update role
    const updated = await TeamService.updateMemberRole(
      newTeam.id,
      testMember.id,
      "admin",
    );
    expect(updated.role).toBe("admin");

    // Remove member
    const removed = await TeamService.removeTeamMember(
      newTeam.id,
      testMember.id,
    );
    expect(removed).toBe(true);

    // Prevent removing owner
    expect(
      TeamService.removeTeamMember(newTeam.id, testOwner.id),
    ).rejects.toThrow();

    // Clean up
    await db
      .delete(user)
      .where(inArray(user.id, [testOwner.id, testMember.id]));
  });
});
