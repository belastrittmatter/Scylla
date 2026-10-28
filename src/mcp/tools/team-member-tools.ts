import type { McpServer } from "@modelcontextprotocol/server";
import { TeamService } from "@/services/team/team-service";
import type { McpToolContext } from "../types";
import {
  addTeamMemberSchema,
  removeTeamMemberSchema,
  updateTeamMemberRoleSchema,
} from "../schemas/crud-schemas";
import {
  resolveTeamAndVerifyAccess,
  resolveUserId,
  formatToolSuccess,
  formatToolError,
} from "./auth-helpers";

export function registerTeamMemberTools(server: McpServer, ctx: McpToolContext) {
  server.registerTool(
    "add_team_member",
    {
      description: "Add or invite a member to a team workspace (requires owner or admin role).",
      inputSchema: addTeamMemberSchema,
    },
    async ({ teamId, userId, email, role }) => {
      try {
        const currentUser = await ctx.getCurrentUser();
        const [team, resolved] = await Promise.all([
          resolveTeamAndVerifyAccess(teamId, currentUser.id, "admin"),
          !userId && email ? ctx.resolveAttendeeEmail(email) : Promise.resolve(undefined),
        ]);
        const resolvedEmail = resolved || email;
        const member = await TeamService.addTeamMember({
          teamId: team.id,
          userId,
          email: resolvedEmail,
          role: role ?? "member",
        });
        return formatToolSuccess({ message: "Team member added successfully", member });
      } catch (err) {
        return formatToolError(err);
      }
    }
  );

  server.registerTool(
    "remove_team_member",
    {
      description: "Remove a member from a team workspace (requires owner or admin role).",
      inputSchema: removeTeamMemberSchema,
    },
    async ({ teamId, userId }) => {
      try {
        const currentUser = await ctx.getCurrentUser();
        const [team, targetUserId] = await Promise.all([
          resolveTeamAndVerifyAccess(teamId, currentUser.id, "admin"),
          resolveUserId(userId, currentUser.id, ctx),
        ]);
        if (!targetUserId) throw new Error(`User '${userId}' not found.`);
        if (targetUserId === team.ownerId) throw new Error("Cannot remove the owner of the team.");
        await TeamService.removeTeamMember(team.id, targetUserId);
        return formatToolSuccess({
          message: `Member removed from team '${team.name}' successfully`,
          teamId: team.id,
          userId: targetUserId,
        });
      } catch (err) {
        return formatToolError(err);
      }
    }
  );

  server.registerTool(
    "update_team_member_role",
    {
      description: "Update a member's role in a team workspace (requires owner or admin role).",
      inputSchema: updateTeamMemberRoleSchema,
    },
    async ({ teamId, userId, role }) => {
      try {
        const currentUser = await ctx.getCurrentUser();
        const [team, targetUserId] = await Promise.all([
          resolveTeamAndVerifyAccess(teamId, currentUser.id, "admin"),
          resolveUserId(userId, currentUser.id, ctx),
        ]);
        if (!targetUserId) throw new Error(`User '${userId}' not found.`);
        const updated = await TeamService.updateMemberRole(team.id, targetUserId, role);
        return formatToolSuccess({
          message: `Role updated to '${role}' successfully`,
          member: updated,
        });
      } catch (err) {
        return formatToolError(err);
      }
    }
  );
}
