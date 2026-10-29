import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { createCalendarMcpServer } from "@/app/api/mcp/route";
import { db, user } from "@/db";
import { eq, inArray } from "drizzle-orm";

interface RegisteredToolDef {
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

function getTools(server: unknown): Record<string, RegisteredToolDef> {
  return (server as { _registeredTools: Record<string, RegisteredToolDef> })
    ._registeredTools;
}

describe("MCP Team CRUD Tools Suite", () => {
  const ownerId = "usr_team_crud_owner";
  const memberId = "usr_team_crud_member";
  const strangerId = "usr_team_crud_stranger";

  beforeEach(async () => {
    for (const [id, email, name] of [
      [ownerId, "owner_crud@example.com", "Team Owner"],
      [memberId, "member_crud@example.com", "Team Member"],
      [strangerId, "stranger_crud@example.com", "Stranger"],
    ]) {
      const exists = await db
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1);
      if (exists.length === 0) {
        await db.insert(user).values({
          id,
          email,
          name,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  });

  afterAll(async () => {
    await db
      .delete(user)
      .where(inArray(user.id, [ownerId, memberId, strangerId]));
  });

  it("registers all 7 team CRUD tools", async () => {
    const server = await createCalendarMcpServer({ sub: ownerId });
    const tools = getTools(server);
    expect(tools["create_team"]).toBeDefined();
    expect(tools["get_team"]).toBeDefined();
    expect(tools["update_team"]).toBeDefined();
    expect(tools["delete_team"]).toBeDefined();
    expect(tools["add_team_member"]).toBeDefined();
    expect(tools["remove_team_member"]).toBeDefined();
    expect(tools["update_team_member_role"]).toBeDefined();
  });

  it("manages complete team lifecycle with role-based permissions", async () => {
    const ownerServer = await createCalendarMcpServer({ sub: ownerId });
    const strangerServer = await createCalendarMcpServer({ sub: strangerId });
    const ownerTools = getTools(ownerServer);
    const strangerTools = getTools(strangerServer);

    const uid = Math.random().toString(36).substring(2, 7);
    // 1. create_team
    const createRes = await ownerTools["create_team"].handler({
      name: `Core Platform Team ${uid}`,
      description: "Platform engineering and infrastructure",
    });
    expect(createRes.isError).toBeFalsy();
    const createdData = JSON.parse(createRes.content[0].text);
    const teamId = createdData.team.id;
    expect(createdData.team.name).toBe(`Core Platform Team ${uid}`);
    expect(createdData.team.ownerId).toBe(ownerId);

    // 2. get_team by owner
    const getRes = await ownerTools["get_team"].handler({ teamId });
    expect(getRes.isError).toBeFalsy();
    const getData = JSON.parse(getRes.content[0].text);
    expect(getData.team.memberCount).toBe(1);

    // 3. get_team by stranger should fail
    const strangerGet = await strangerTools["get_team"].handler({ teamId });
    expect(strangerGet.isError).toBe(true);

    // 4. update_team by owner
    const updateRes = await ownerTools["update_team"].handler({
      teamId,
      name: "Core Infrastructure Team",
    });
    expect(updateRes.isError).toBeFalsy();
    const updatedData = JSON.parse(updateRes.content[0].text);
    expect(updatedData.team.name).toBe("Core Infrastructure Team");

    // 5. update_team by stranger should fail
    const strangerUpdate = await strangerTools["update_team"].handler({
      teamId,
      name: "Hacked Team",
    });
    expect(strangerUpdate.isError).toBe(true);

    // 6. add_team_member
    const addRes = await ownerTools["add_team_member"].handler({
      teamId,
      userId: memberId,
      role: "member",
    });
    expect(addRes.isError).toBeFalsy();

    // 7. update_team_member_role
    const roleRes = await ownerTools["update_team_member_role"].handler({
      teamId,
      userId: memberId,
      role: "admin",
    });
    expect(roleRes.isError).toBeFalsy();
    const roleData = JSON.parse(roleRes.content[0].text);
    expect(roleData.member.role).toBe("admin");

    // 8. remove_team_member (owner cannot be removed)
    const removeOwnerRes = await ownerTools["remove_team_member"].handler({
      teamId,
      userId: ownerId,
    });
    expect(removeOwnerRes.isError).toBe(true);

    // 9. remove_team_member (remove added member)
    const removeMemberRes = await ownerTools["remove_team_member"].handler({
      teamId,
      userId: memberId,
    });
    expect(removeMemberRes.isError).toBeFalsy();

    // 10. delete_team by stranger fails
    const strangerDelete = await strangerTools["delete_team"].handler({
      teamId,
    });
    expect(strangerDelete.isError).toBe(true);

    // 11. delete_team by owner succeeds
    const deleteRes = await ownerTools["delete_team"].handler({ teamId });
    expect(deleteRes.isError).toBeFalsy();
  });
});
