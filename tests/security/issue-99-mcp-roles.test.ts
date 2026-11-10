import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { inArray } from "drizzle-orm";
import { createCalendarMcpServer } from "@/app/api/mcp/route";
import { db, user } from "@/db";
import { ProjectService } from "@/services/project/project-service";
import { TeamService } from "@/services/team/team-service";

type ToolResult = { content: Array<{ text: string }>; isError?: boolean };
type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

const uid = Math.random().toString(36).slice(2, 7);
const ids = {
  owner: `usr_mcpr_owner_${uid}`,
  admin: `usr_mcpr_admin_${uid}`,
  member: `usr_mcpr_member_${uid}`,
  viewer: `usr_mcpr_viewer_${uid}`,
};

/** Calls an MCP tool as `userId`; thrown errors are folded into an error result. */
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
  try {
    return await tools[name].handler(args);
  } catch (err) {
    return { isError: true, content: [{ text: String(err) }] };
  }
}

describe("MCP project tools enforce team roles (#99)", () => {
  let teamId: string;
  let projectId: string;

  beforeAll(async () => {
    await db.insert(user).values(
      Object.values(ids).map((id) => ({
        id,
        email: `${id}@example.com`,
        name: id,
      })),
    );
    const team = await TeamService.createTeam({
      name: `MCP Roles ${uid}`,
      slug: `mcp-roles-${uid}`,
      ownerId: ids.owner,
    });
    teamId = team.id;
    for (const [userId, role] of [
      [ids.admin, "admin"],
      [ids.member, "member"],
      [ids.viewer, "viewer"],
    ] as const) {
      await TeamService.addTeamMember({ teamId, userId, role });
    }
    projectId = (await ProjectService.createProject({ teamId, name: "P" })).id;
  });

  afterAll(async () => {
    if (teamId) await TeamService.deleteTeam(teamId);
    await db.delete(user).where(inArray(user.id, Object.values(ids)));
  });

  test("create_project requires admin", async () => {
    for (const who of [ids.viewer, ids.member]) {
      const res = await callTool(who, "create_project", {
        teamId,
        name: "Denied project",
      });
      expect(res.isError).toBe(true);
      expect(res.content[0].text).toMatch(/admin role required/);
    }

    const admin = await callTool(ids.admin, "create_project", {
      teamId,
      name: "Admin project",
    });
    expect(admin.isError).toBeFalsy();
  });

  test("update_project requires admin", async () => {
    for (const who of [ids.viewer, ids.member]) {
      const res = await callTool(who, "update_project", {
        projectId,
        name: "Renamed",
      });
      expect(res.isError).toBe(true);
      expect(res.content[0].text).toMatch(/admin role required/);
    }
    const admin = await callTool(ids.admin, "update_project", {
      projectId,
      name: "Renamed by admin",
    });
    expect(admin.isError).toBeFalsy();
    expect((await ProjectService.getProjectById(projectId))?.name).toBe(
      "Renamed by admin",
    );
  });
});
