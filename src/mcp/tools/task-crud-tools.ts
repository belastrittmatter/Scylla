import type { McpServer } from "@modelcontextprotocol/server";
import { TaskService } from "@/services/task/task-service";
import type { McpToolContext } from "../types";
import {
  getTaskSchema,
  deleteTaskSchema,
  addTaskCommentSchema,
  listTaskCommentsSchema,
} from "../schemas/crud-schemas";
import {
  resolveTeamAndVerifyAccess,
  formatToolSuccess,
  formatToolError,
} from "./auth-helpers";

export function registerTaskCrudTools(server: McpServer, ctx: McpToolContext) {
  server.registerTool(
    "get_task",
    {
      description:
        "Retrieve task details including assignee, creator, project, and discussion comments.",
      inputSchema: getTaskSchema,
    },
    async ({ taskId }) => {
      try {
        ctx.assertScope("tasks.readonly");
        const [currentUser, task] = await Promise.all([
          ctx.getCurrentUser(),
          TaskService.getTaskById(taskId),
        ]);
        if (!task) throw new Error(`Task '${taskId}' not found.`);
        const [, comments] = await Promise.all([
          resolveTeamAndVerifyAccess(task.teamId, currentUser.id),
          TaskService.getTaskComments(task.id),
        ]);
        return formatToolSuccess({ task: { ...task, comments } });
      } catch (err) {
        return formatToolError(err);
      }
    },
  );

  server.registerTool(
    "delete_task",
    {
      description:
        "Delete a task by task ID (team members only; viewers cannot delete).",
      inputSchema: deleteTaskSchema,
    },
    async ({ taskId }) => {
      try {
        ctx.assertScope("tasks.delete");
        const [currentUser, task] = await Promise.all([
          ctx.getCurrentUser(),
          TaskService.getTaskById(taskId),
        ]);
        const access = task
          ? await TaskService.getDeleteAccess(task, currentUser.id)
          : "not_member";
        // Non-members see "not found" so task ids can't be probed.
        if (!task || access === "not_member") {
          throw new Error(`Task '${taskId}' not found.`);
        }
        if (access === "forbidden") {
          throw new Error(
            "Permission denied: only team members (not viewers) can delete tasks.",
          );
        }

        await TaskService.deleteTask(task.id);
        return formatToolSuccess({
          message: `Task '${task.title}' deleted successfully`,
          taskId: task.id,
        });
      } catch (err) {
        return formatToolError(err);
      }
    },
  );

  server.registerTool(
    "add_task_comment",
    {
      description: "Add a discussion comment or note to a task.",
      inputSchema: addTaskCommentSchema,
    },
    async ({ taskId, content }) => {
      try {
        ctx.assertScope("tasks.write");
        const [currentUser, task] = await Promise.all([
          ctx.getCurrentUser(),
          TaskService.getTaskById(taskId),
        ]);
        if (!task) throw new Error(`Task '${taskId}' not found.`);
        await resolveTeamAndVerifyAccess(task.teamId, currentUser.id);

        const comment = await TaskService.createTaskComment({
          taskId: task.id,
          userId: currentUser.id,
          content,
        });
        return formatToolSuccess({
          message: "Comment added successfully",
          comment,
        });
      } catch (err) {
        return formatToolError(err);
      }
    },
  );

  server.registerTool(
    "list_task_comments",
    {
      description: "List all discussion comments for a specific task.",
      inputSchema: listTaskCommentsSchema,
    },
    async ({ taskId }) => {
      try {
        ctx.assertScope("tasks.readonly");
        const [currentUser, task] = await Promise.all([
          ctx.getCurrentUser(),
          TaskService.getTaskById(taskId),
        ]);
        if (!task) throw new Error(`Task '${taskId}' not found.`);
        const [, comments] = await Promise.all([
          resolveTeamAndVerifyAccess(task.teamId, currentUser.id),
          TaskService.getTaskComments(task.id),
        ]);
        return formatToolSuccess({
          taskId: task.id,
          comments,
          count: comments.length,
        });
      } catch (err) {
        return formatToolError(err);
      }
    },
  );
}
