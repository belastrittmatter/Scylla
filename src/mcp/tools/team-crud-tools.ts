import type { McpServer } from "@modelcontextprotocol/server";
import { TeamService } from "@/services/team/team-service";
import { ProjectService } from "@/services/project/project-service";
import type { McpToolContext } from "../types";
import {
  createTeamSchema,
  getTeamSchema,
  updateTeamSchema,
  deleteTeamSchema,
} from "../schemas/crud-schemas";
import {
  resolveTeamAndVerifyAccess,
  formatToolSuccess,
  formatToolError,
} from "./auth-helpers";

export function registerTeamCrudTools(server: McpServer, ctx: McpToolContext) {
  server.registerTool(
    "create_team",
    {
      description: "Create a new team workspace. Caller becomes owner.",
      inputSchema: createTeamSchema,
    },
    async ({ name, slug, description }) => {
      try {
        const currentUser = await ctx.getCurrentUser();
        const team = await TeamService.createTeam({
          name,
          slug,
          description,
          ownerId: currentUser.id,
        });
        return formatToolSuccess({
          message: "Team workspace created successfully",
          team,
        });
      } catch (err) {
        return formatToolError(err);
      }
    },
  );

  server.registerTool(
    "get_team",
    {
      description:
        "Retrieve detailed team workspace metadata, member list, and project count.",
      inputSchema: getTeamSchema,
    },
    async ({ teamId }) => {
      try {
        const currentUser = await ctx.getCurrentUser();
        const team = await resolveTeamAndVerifyAccess(teamId, currentUser.id);
        const projects = await ProjectService.listProjectsByTeam(team.id);
        return formatToolSuccess({
          team: {
            id: team.id,
            name: team.name,
            slug: team.slug,
            description: team.description,
            ownerId: team.ownerId,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
            memberCount: team.members.length,
            projectCount: projects.length,
            members: team.members,
            projects: projects.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              status: p.status,
              color: p.color,
            })),
          },
        });
      } catch (err) {
        return formatToolError(err);
      }
    },
  );

  server.registerTool(
    "update_team",
    {
      description:
        "Update team name, slug, or description (requires team owner or admin role).",
      inputSchema: updateTeamSchema,
    },
    async ({ teamId, name, slug, description }) => {
      try {
        const currentUser = await ctx.getCurrentUser();
        const team = await resolveTeamAndVerifyAccess(
          teamId,
          currentUser.id,
          "admin",
        );
        const updated = await TeamService.updateTeam(team.id, {
          name,
          slug,
          description,
        });
        return formatToolSuccess({
          message: "Team updated successfully",
          team: updated,
        });
      } catch (err) {
        return formatToolError(err);
      }
    },
  );

  server.registerTool(
    "delete_team",
    {
      description: "Delete a team workspace (requires team owner role).",
      inputSchema: deleteTeamSchema,
    },
    async ({ teamId }) => {
      try {
        const currentUser = await ctx.getCurrentUser();
        const team = await resolveTeamAndVerifyAccess(
          teamId,
          currentUser.id,
          "owner",
        );
        await TeamService.deleteTeam(team.id);
        return formatToolSuccess({
          message: `Team '${team.name}' deleted successfully`,
          teamId: team.id,
        });
      } catch (err) {
        return formatToolError(err);
      }
    },
  );
}
