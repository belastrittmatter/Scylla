import type { McpServer } from "@modelcontextprotocol/server";
import { ProjectService } from "@/services/project/project-service";
import { TaskService } from "@/services/task/task-service";
import type { McpToolContext } from "../types";
import {
  getProjectSchema,
  updateProjectSchema,
  deleteProjectSchema,
} from "../schemas/crud-schemas";
import {
  resolveTeamAndVerifyAccess,
  formatToolSuccess,
  formatToolError,
} from "./auth-helpers";

export function registerProjectCrudTools(
  server: McpServer,
  ctx: McpToolContext,
) {
  server.registerTool(
    "get_project",
    {
      description:
        "Retrieve project metadata by project ID (or slug) including task metrics.",
      inputSchema: getProjectSchema,
    },
    async ({ projectId, teamId }) => {
      try {
        const [currentUser, initialProj] = await Promise.all([
          ctx.getCurrentUser(),
          ProjectService.getProjectById(projectId),
        ]);
        let proj = initialProj;
        if (!proj && teamId) {
          const team = await resolveTeamAndVerifyAccess(teamId, currentUser.id);
          proj = await ProjectService.getProjectBySlug(team.id, projectId);
        }
        if (!proj) throw new Error(`Project '${projectId}' not found.`);

        const [, tasks] = await Promise.all([
          resolveTeamAndVerifyAccess(proj.teamId, currentUser.id),
          TaskService.listTasks({ projectId: proj.id, teamId: proj.teamId }),
        ]);
        const metrics = {
          totalTasks: tasks.length,
          todoTasks: tasks.filter((t) => t.status === "todo").length,
          inProgressTasks: tasks.filter((t) => t.status === "in_progress")
            .length,
          inReviewTasks: tasks.filter((t) => t.status === "in_review").length,
          doneTasks: tasks.filter((t) => t.status === "done").length,
          cancelledTasks: tasks.filter((t) => t.status === "cancelled").length,
        };

        return formatToolSuccess({ project: proj, metrics });
      } catch (err) {
        return formatToolError(err);
      }
    },
  );

  server.registerTool(
    "update_project",
    {
      description: "Update project metadata, status, or accent color.",
      inputSchema: updateProjectSchema,
    },
    async ({ projectId, name, slug, description, status, color }) => {
      try {
        const [currentUser, proj] = await Promise.all([
          ctx.getCurrentUser(),
          ProjectService.getProjectById(projectId),
        ]);
        if (!proj) throw new Error(`Project '${projectId}' not found.`);
        await resolveTeamAndVerifyAccess(proj.teamId, currentUser.id);

        const updated = await ProjectService.updateProject(proj.id, {
          name,
          slug,
          description,
          status,
          color,
        });
        return formatToolSuccess({
          message: "Project updated successfully",
          project: updated,
        });
      } catch (err) {
        return formatToolError(err);
      }
    },
  );

  server.registerTool(
    "delete_project",
    {
      description: "Delete a project workspace by project ID.",
      inputSchema: deleteProjectSchema,
    },
    async ({ projectId }) => {
      try {
        const [currentUser, proj] = await Promise.all([
          ctx.getCurrentUser(),
          ProjectService.getProjectById(projectId),
        ]);
        if (!proj) throw new Error(`Project '${projectId}' not found.`);
        await resolveTeamAndVerifyAccess(proj.teamId, currentUser.id);

        await ProjectService.deleteProject(proj.id);
        return formatToolSuccess({
          message: `Project '${proj.name}' deleted successfully`,
          projectId: proj.id,
        });
      } catch (err) {
        return formatToolError(err);
      }
    },
  );
}
