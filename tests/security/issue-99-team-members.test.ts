import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { inArray } from "drizzle-orm";
import { createCalendarMcpServer } from "@/app/api/mcp/route";
import { PATCH as patchMemberHandler } from "@/app/api/teams/[id]/members/[userId]/route";
import { db, user } from "@/db";
import { TeamService } from "@/services/team/team-service";

type ToolResult = { content: Array<{ text: string }>; isError?: boolean };
type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

const uid = Math.random().toString(36).slice(2, 7);
const ids = {
  owner: `usr_tm_owner_${uid}`,
  rowOwner: `usr_tm_rowowner_${uid}`,
  admin: `usr_tm_admin_${uid}`,
  admin2: `usr_tm_admin2_${uid}`,
  member: `usr_tm_member_${uid}`,
  outsider: `usr_tm_outsider_${uid}`,
};

async function callTool(
  userId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const server = await createCalendarMcpServer({ sub: userId, scopes: ["*"] });
  const tools = (
    server as unknown as {
      _registeredTools: Record<string, { handler: ToolHandler }>;
    }
  )._registeredTools;
  return tools[name].handler(args);
}

async function restPatch(
  teamId: string,
  actor: string,
  target: string,
  body: unknown,
) {
  const req = new Request(
    `http://localhost/api/teams/${teamId}/members/${target}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-user-id": actor },
      body: JSON.stringify(body),
    },
  );
  return patchMemberHandler(req, { params: { id: teamId, userId: target } });
}

describe("Team member role management is consistent and owner-safe (#99)", () => {
  let teamId: string;

  beforeEach(async () => {
    await db.insert(user).values(
      Object.values(ids).map((id) => ({
        id,
        email: `${id}@example.com`,
        name: id,
      })),
    );
    teamId = (
      await TeamService.createTeam({
        name: `Members ${uid}`,
        slug: `members-${uid}`,
        ownerId: ids.owner,
      })
    ).id;
    for (const [userId, role] of [
      [ids.rowOwner, "owner"],
      [ids.admin, "admin"],
      [ids.admin2, "admin"],
      [ids.member, "member"],
    ] as const) {
      await TeamService.addTeamMember({ teamId, userId, role });
    }
  });

  afterEach(async () => {
    await TeamService.deleteTeam(teamId);
    await db.delete(user).where(inArray(user.id, Object.values(ids)));
  });

  test("REST and MCP rank a member row with role 'owner' the same way", async () => {
    const rest = await restPatch(teamId, ids.rowOwner, ids.member, {
      role: "viewer",
    });
    expect(rest.status).toBe(200);
    const mcp = await callTool(ids.rowOwner, "update_team_member_role", {
      teamId,
      userId: ids.member,
      role: "member",
    });
    expect(mcp.isError).toBeFalsy();
    // Both paths let a row-owner manage admins.
    expect(
      (await restPatch(teamId, ids.rowOwner, ids.admin, { role: "member" }))
        .status,
    ).toBe(200);
  });

  test("REST PATCH validates role against the TeamRole enum", async () => {
    const res = await restPatch(teamId, ids.owner, ids.member, {
      role: "superuser",
    });
    expect(res.status).toBe(400);
  });

  test("no one can change the team ownerId's role", async () => {
    for (const actor of [ids.admin, ids.rowOwner]) {
      const mcp = await callTool(actor, "update_team_member_role", {
        teamId,
        userId: ids.owner,
        role: "viewer",
      });
      expect(mcp.isError).toBe(true);
      expect(mcp.content[0].text).toMatch(/team owner/i);
      expect(
        (await restPatch(teamId, actor, ids.owner, { role: "viewer" })).status,
      ).toBe(403);
    }
    expect(await TeamService.getUserRole(teamId, ids.owner)).toBe("owner");
  });

  test("MCP update_team_member_role blocks admin escalation", async () => {
    const toOwner = await callTool(ids.admin, "update_team_member_role", {
      teamId,
      userId: ids.member,
      role: "owner",
    });
    expect(toOwner.isError).toBe(true);
    const otherAdmin = await callTool(ids.admin, "update_team_member_role", {
      teamId,
      userId: ids.admin2,
      role: "viewer",
    });
    expect(otherAdmin.isError).toBe(true);
    const ok = await callTool(ids.admin, "update_team_member_role", {
      teamId,
      userId: ids.member,
      role: "viewer",
    });
    expect(ok.isError).toBeFalsy();
    const outsider = await callTool(ids.outsider, "update_team_member_role", {
      teamId,
      userId: ids.member,
      role: "admin",
    });
    expect(outsider.isError).toBe(true);
  });

  test("MCP remove_team_member and add_team_member enforce the same rules", async () => {
    const removeOwner = await callTool(ids.rowOwner, "remove_team_member", {
      teamId,
      userId: ids.owner,
    });
    expect(removeOwner.isError).toBe(true);
    const removeAdmin = await callTool(ids.admin, "remove_team_member", {
      teamId,
      userId: ids.admin2,
    });
    expect(removeAdmin.isError).toBe(true);
    const addOwner = await callTool(ids.admin, "add_team_member", {
      teamId,
      userId: ids.outsider,
      role: "owner",
    });
    expect(addOwner.isError).toBe(true);
    const removeMember = await callTool(ids.admin, "remove_team_member", {
      teamId,
      userId: ids.member,
    });
    expect(removeMember.isError).toBeFalsy();
    expect(await TeamService.getUserRole(teamId, ids.member)).toBeNull();
  });

  test("service requires an actor and re-checks inside the write", async () => {
    await expect(
      TeamService.updateMemberRole(teamId, ids.admin2, "viewer", ids.admin),
    ).rejects.toThrow(/Admins cannot/);
    await expect(
      TeamService.removeTeamMember(teamId, ids.admin2, ids.member),
    ).rejects.toThrow(/Permission denied/);
    // Self-removal is always allowed (except for the ownerId).
    expect(
      await TeamService.removeTeamMember(teamId, ids.member, ids.member),
    ).toBe(true);
    await expect(
      TeamService.removeTeamMember(teamId, ids.owner, ids.owner),
    ).rejects.toThrow(/owner/);
  });
});
