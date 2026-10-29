import type { McpServer } from "@modelcontextprotocol/server";
import {
  parseDbTimestampToIso,
  parseTimestampMs,
} from "@/components/tasks/task-utils";
import { TeamService } from "@/services/team/team-service";
import { ProjectService } from "@/services/project/project-service";
import { TaskService } from "@/services/task/task-service";
import { db, user } from "@/db";
import { taskTimeSession } from "@/db/schema";
import { inArray, sql } from "drizzle-orm";
import {
  listTeamsSchema,
  listProjectsSchema,
  createProjectSchema,
  listTasksSchema,
  createTaskSchema,
  updateTaskSchema,
  getTaskBoardSchema,
  getActiveTasksSchema,
  getTaskTimelineSchema,
} from "../schemas";
import { buildTaskBoardMarkdown } from "@/utils/mcp-markdown-builder";
import { getTaskBoardUiHtml } from "@/utils/mcp-ui-builder";
import type { McpToolContext } from "../types";
import type { TaskStatus, TaskPriority } from "@/services/task/task-types";
import { resolveProject, resolveUserId } from "./auth-helpers";

function parseAndValidateDate(
  dateStr: string | undefined | null,
  fieldName: string,
): Date | undefined | null {
  if (dateStr === undefined) return undefined;
  if (dateStr === null || dateStr.trim() === "") return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    throw new Error(
      `Invalid date format for ${fieldName}: '${dateStr}'. Expected ISO timestamp or YYYY-MM-DD.`,
    );
  }
  return d;
}

async function resolveAndVerifyTeam(teamIdOrSlug: string, userId: string) {
  const userTeams = await TeamService.listUserTeams(userId);
  let matched = userTeams.find(
    (t) => t.id === teamIdOrSlug || t.slug === teamIdOrSlug,
  );

  if (!matched) {
    const [byId, bySlug] = await Promise.all([
      TeamService.getTeamById(teamIdOrSlug),
      TeamService.getTeamBySlug(teamIdOrSlug),
    ]);
    const directTeam = byId || bySlug;
    if (directTeam) {
      const isMember =
        directTeam.ownerId === userId ||
        directTeam.members?.some((m) => m.userId === userId);
      if (isMember) {
        matched = directTeam;
      }
    }
  }

  if (!matched) {
    throw new Error(`Team '${teamIdOrSlug}' not found or access denied.`);
  }

  return matched;
}

async function getTaskSessionStatsMap(taskIds: string[]) {
  if (taskIds.length === 0) {
    return new Map<
      string,
      { totalSpentSeconds: number; activeSessionStartedAt: string | null }
    >();
  }
  const stats = await db
    .select({
      taskId: taskTimeSession.taskId,
      totalSpentSeconds: sql<number>`COALESCE(SUM(CASE WHEN ${taskTimeSession.endedAt} IS NOT NULL THEN ${taskTimeSession.durationSeconds} ELSE 0 END), 0)::int`,
      activeSessionStartedAt: sql<
        string | null
      >`MAX(CASE WHEN ${taskTimeSession.endedAt} IS NULL THEN ${taskTimeSession.startedAt} AT TIME ZONE 'UTC' ELSE NULL END)`,
    })
    .from(taskTimeSession)
    .where(inArray(taskTimeSession.taskId, taskIds))
    .groupBy(taskTimeSession.taskId);

  return new Map<
    string,
    { totalSpentSeconds: number; activeSessionStartedAt: string | null }
  >(
    stats.map((s) => [
      s.taskId,
      {
        totalSpentSeconds: Number(s.totalSpentSeconds) || 0,
        activeSessionStartedAt: parseDbTimestampToIso(s.activeSessionStartedAt),
      },
    ]),
  );
}

export function registerTaskTools(server: McpServer, ctx: McpToolContext) {
  // 0. Register UI Resource for MCP Apps (SEP-1865)
  server.registerResource(
    "task_kanban_board_app",
    "ui://tasks/kanban-board",
    {
      mimeType: "text/html;profile=mcp-app",
      description:
        "MCP App UI resource for get_task_board. Renders a 5-column Kanban board (todo, in_progress, in_review, done, cancelled) with priority filtering and drag-and-drop status updates via update_task.",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html;profile=mcp-app",
          text: getTaskBoardUiHtml(),
        },
      ],
    }),
  );
  // 1. list_teams
  server.registerTool(
    "list_teams",
    {
      description: "List teams accessible to the current authenticated user.",
      inputSchema: listTeamsSchema,
    },
    async () => {
      const currentUser = await ctx.getCurrentUser();
      const teams = await TeamService.listUserTeams(currentUser.id);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                teams: teams.map((t) => ({
                  id: t.id,
                  name: t.name,
                  slug: t.slug,
                  description: t.description,
                  ownerId: t.ownerId,
                  createdAt: t.createdAt,
                })),
                count: teams.length,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 2. list_projects
  server.registerTool(
    "list_projects",
    {
      description: "List projects within a team, filterable by status.",
      inputSchema: listProjectsSchema,
    },
    async ({ teamId, status }) => {
      const currentUser = await ctx.getCurrentUser();
      const team = await resolveAndVerifyTeam(teamId, currentUser.id);

      const projects = await ProjectService.listProjectsByTeam(team.id, {
        status,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                team: { id: team.id, name: team.name, slug: team.slug },
                projects: projects.map((p) => ({
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  description: p.description,
                  status: p.status,
                  color: p.color,
                  createdAt: p.createdAt,
                })),
                count: projects.length,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 3. create_project
  server.registerTool(
    "create_project",
    {
      description: "Create a new project scoped to a team.",
      inputSchema: createProjectSchema,
    },
    async ({ teamId, name, description, status, color }) => {
      const currentUser = await ctx.getCurrentUser();
      const team = await resolveAndVerifyTeam(teamId, currentUser.id);

      const project = await ProjectService.createProject({
        teamId: team.id,
        name,
        description,
        status,
        color,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "Project created successfully",
                project: {
                  id: project.id,
                  name: project.name,
                  slug: project.slug,
                  teamId: project.teamId,
                  status: project.status,
                  description: project.description,
                  color: project.color,
                  createdAt: project.createdAt,
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 4. list_tasks
  server.registerTool(
    "list_tasks",
    {
      description:
        "Retrieve tasks with flexible filters (team, project, user/assignee, status, priority, deadline horizon, overdue).",
      inputSchema: listTasksSchema,
    },
    async ({
      teamId,
      projectId,
      user: userQuery,
      assigneeId,
      status,
      priority,
      dueBefore,
      deadlineHorizonDays,
      overdue,
      hasActiveSession,
    }) => {
      const currentUser = await ctx.getCurrentUser();
      const targetUserQuery = userQuery || assigneeId;

      const [targetTeamIds, resolvedAssignee] = await Promise.all([
        teamId
          ? resolveAndVerifyTeam(teamId, currentUser.id).then((team) => [
              team.id,
            ])
          : TeamService.listUserTeams(currentUser.id).then((teams) =>
              teams.map((t) => t.id),
            ),
        targetUserQuery
          ? resolveUserId(targetUserQuery, currentUser.id, ctx)
          : Promise.resolve(undefined),
      ]);

      if (!teamId && targetTeamIds.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ tasks: [], count: 0 }, null, 2),
            },
          ],
        };
      }

      let resolvedAssigneeId: string | undefined = undefined;
      if (targetUserQuery) {
        if (resolvedAssignee) {
          resolvedAssigneeId = resolvedAssignee;
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    filter: {
                      teamId: teamId || null,
                      projectId: projectId || null,
                      user: targetUserQuery || null,
                      resolvedAssigneeId: null,
                      status: status || null,
                      priority: priority || null,
                    },
                    tasks: [],
                    count: 0,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
      }

      let computedDueBefore: Date | undefined = undefined;
      if (dueBefore) {
        const parsed = parseAndValidateDate(dueBefore, "dueBefore");
        if (parsed) computedDueBefore = parsed;
      } else if (deadlineHorizonDays !== undefined) {
        const horizon = new Date();
        horizon.setDate(horizon.getDate() + deadlineHorizonDays);
        computedDueBefore = horizon;
      }

      const allTasks = await TaskService.listTasks({
        teamId: targetTeamIds.length === 1 ? targetTeamIds[0] : targetTeamIds,
        projectId,
        status: status as TaskStatus | TaskStatus[] | undefined,
        priority: priority as TaskPriority | TaskPriority[] | undefined,
        assigneeId: resolvedAssigneeId,
        dueBefore: computedDueBefore,
        overdue,
      });

      const taskIds = allTasks.map((t) => t.id);
      const statsMap = await getTaskSessionStatsMap(taskIds);

      let filteredTasks = allTasks;
      if (hasActiveSession !== undefined) {
        filteredTasks = allTasks.filter((t) => {
          const s = statsMap.get(t.id);
          const hasActive = Boolean(s?.activeSessionStartedAt);
          return hasActiveSession ? hasActive : !hasActive;
        });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                filter: {
                  teamId: teamId || null,
                  projectId: projectId || null,
                  user: targetUserQuery || null,
                  resolvedAssigneeId: resolvedAssigneeId || null,
                  status: status || null,
                  priority: priority || null,
                  hasActiveSession:
                    hasActiveSession !== undefined ? hasActiveSession : null,
                },
                tasks: filteredTasks.map((t) => {
                  const s = statsMap.get(t.id);
                  return {
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    teamId: t.teamId,
                    projectId: t.projectId,
                    creatorId: t.creatorId,
                    assigneeId: t.assigneeId,
                    dueDate: t.dueDate,
                    position: t.position,
                    estimatedMinutes: t.estimatedMinutes ?? 60,
                    totalSpentSeconds: s?.totalSpentSeconds ?? 0,
                    activeSessionStartedAt: s?.activeSessionStartedAt ?? null,
                    createdAt: t.createdAt,
                  };
                }),
                count: filteredTasks.length,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 5. create_task
  server.registerTool(
    "create_task",
    {
      description:
        "Create a task with title, description, status, assignee, deadline, and required project (returns available project options if not specified).",
      inputSchema: createTaskSchema,
    },
    async ({
      teamId,
      title,
      description,
      status,
      priority,
      projectId,
      assigneeId,
      dueDate,
      estimatedMinutes,
    }) => {
      const currentUser = await ctx.getCurrentUser();
      const team = await resolveAndVerifyTeam(teamId, currentUser.id);

      // Project ID is required. If user did not provide a project, return available project options for selection.
      if (!projectId || !projectId.trim()) {
        const teamProjects = await ProjectService.listProjectsByTeam(team.id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  requiresProjectSelection: true,
                  error: "Project ID is required to create a task.",
                  message:
                    teamProjects.length > 0
                      ? `Project is required. Please select one of the following available projects in team '${team.name}' to create this task:`
                      : `Project is required to create a task, but no projects exist in team '${team.name}'. Please create a project first using create_project.`,
                  projects: teamProjects.map((p) => ({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    status: p.status,
                    color: p.color,
                  })),
                  count: teamProjects.length,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const [resolvedProject, resolvedAssigneeId] = await Promise.all([
        resolveProject(projectId, currentUser.id, team.id),
        assigneeId
          ? resolveUserId(assigneeId, currentUser.id, ctx)
          : Promise.resolve(null),
      ]);
      if (!resolvedProject || resolvedProject.teamId !== team.id) {
        throw new Error(
          `Project '${projectId}' not found in team '${team.name}'.`,
        );
      }

      if (assigneeId && !resolvedAssigneeId) {
        throw new Error(`Assignee '${assigneeId}' not found.`);
      }

      const parsedDueDate = parseAndValidateDate(dueDate, "dueDate");

      const newTask = await TaskService.createTask({
        teamId: team.id,
        title,
        description,
        status,
        priority,
        projectId: resolvedProject.id,
        creatorId: currentUser.id,
        assigneeId: resolvedAssigneeId,
        dueDate: parsedDueDate ?? undefined,
        estimatedMinutes: estimatedMinutes ?? 60,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "Task created successfully",
                task: {
                  id: newTask.id,
                  title: newTask.title,
                  description: newTask.description,
                  status: newTask.status,
                  priority: newTask.priority,
                  teamId: newTask.teamId,
                  projectId: newTask.projectId,
                  projectName: resolvedProject.name,
                  creatorId: newTask.creatorId,
                  assigneeId: newTask.assigneeId,
                  dueDate: newTask.dueDate,
                  position: newTask.position,
                  createdAt: newTask.createdAt,
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 6. update_task
  server.registerTool(
    "update_task",
    {
      description:
        "Update task properties, project assignment, and progress statuses.",
      inputSchema: updateTaskSchema,
      _meta: {
        ui: { visibility: ["model", "app"] },
      },
    },
    async ({
      taskId,
      title,
      description,
      status,
      priority,
      projectId,
      assigneeId,
      dueDate,
      estimatedMinutes,
    }) => {
      const [currentUser, existingTask] = await Promise.all([
        ctx.getCurrentUser(),
        TaskService.getTaskById(taskId),
      ]);
      if (!existingTask) {
        throw new Error(`Task with ID '${taskId}' not found.`);
      }

      const [team, resolvedAssignee] = await Promise.all([
        resolveAndVerifyTeam(existingTask.teamId, currentUser.id),
        assigneeId !== undefined && assigneeId !== null && assigneeId !== ""
          ? resolveUserId(assigneeId, currentUser.id, ctx)
          : Promise.resolve(undefined),
      ]);

      let resolvedAssigneeId: string | null | undefined = undefined;
      if (assigneeId !== undefined) {
        if (assigneeId === null || assigneeId === "") {
          resolvedAssigneeId = null;
        } else {
          if (!resolvedAssignee) {
            throw new Error(`Assignee '${assigneeId}' not found.`);
          }
          resolvedAssigneeId = resolvedAssignee;
        }
      }

      let resolvedProjectId: string | undefined = undefined;
      let resolvedProjectName: string | undefined = undefined;
      if (projectId !== undefined) {
        const trimmedProj = projectId ? projectId.trim() : "";
        if (
          !trimmedProj ||
          trimmedProj === "select" ||
          trimmedProj === "options"
        ) {
          const teamProjects = await ProjectService.listProjectsByTeam(team.id);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    requiresProjectSelection: true,
                    error:
                      "Project ID is required when updating or assigning a project.",
                    message:
                      teamProjects.length > 0
                        ? `Please select one of the following available projects in team '${team.name}' to assign to this task:`
                        : `No projects exist in team '${team.name}'. Please create a project first using create_project.`,
                    projects: teamProjects.map((p) => ({
                      id: p.id,
                      name: p.name,
                      slug: p.slug,
                      status: p.status,
                      color: p.color,
                    })),
                    count: teamProjects.length,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        const projectObj = await resolveProject(
          trimmedProj,
          currentUser.id,
          existingTask.teamId,
        );
        if (!projectObj || projectObj.teamId !== existingTask.teamId) {
          throw new Error(`Project '${projectId}' not found in task's team.`);
        }
        resolvedProjectId = projectObj.id;
        resolvedProjectName = projectObj.name;
      }

      const parsedDueDate = parseAndValidateDate(dueDate, "dueDate");

      const updatedTask = await TaskService.updateTask(
        taskId,
        {
          title,
          description,
          status,
          priority,
          projectId: resolvedProjectId,
          assigneeId: resolvedAssigneeId,
          dueDate: parsedDueDate,
          estimatedMinutes,
        },
        currentUser.id,
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "Task updated successfully",
                task: {
                  id: updatedTask.id,
                  title: updatedTask.title,
                  description: updatedTask.description,
                  status: updatedTask.status,
                  priority: updatedTask.priority,
                  teamId: updatedTask.teamId,
                  projectId: updatedTask.projectId,
                  projectName: resolvedProjectName,
                  assigneeId: updatedTask.assigneeId,
                  dueDate: updatedTask.dueDate,
                  updatedAt: updatedTask.updatedAt,
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 7. get_task_board
  server.registerTool(
    "get_task_board",
    {
      description:
        "Retrieve team or project tasks grouped by status (todo, in_progress, in_review, done, cancelled). Returns a Markdown Kanban summary and mounts the interactive task_kanban_board_app (ui://tasks/kanban-board) supporting priority filtering and drag-and-drop status updates via update_task.",
      inputSchema: getTaskBoardSchema,
      _meta: {
        ui: {
          resourceUri: "ui://tasks/kanban-board",
          visibility: ["model", "app"],
        },
        "ui/resourceUri": "ui://tasks/kanban-board",
      },
    },
    async ({ teamId, projectId }) => {
      const currentUser = await ctx.getCurrentUser();
      const [team, projectObj] = await Promise.all([
        resolveAndVerifyTeam(teamId, currentUser.id),
        projectId
          ? ProjectService.getProjectById(projectId)
          : Promise.resolve(null),
      ]);

      if (projectId && (!projectObj || projectObj.teamId !== team.id)) {
        throw new Error(
          `Project '${projectId}' not found in team '${team.name}'.`,
        );
      }

      const tasks = await TaskService.listTasks({
        teamId: team.id,
        projectId: projectId,
      });

      const assigneeIds = Array.from(
        new Set(
          tasks
            .map((t) => t.assigneeId)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const assigneeMap = new Map<
        string,
        { name: string | null; email: string | null }
      >();
      if (assigneeIds.length > 0) {
        const users = await db.query.user.findMany({
          where: inArray(user.id, assigneeIds),
          columns: { id: true, name: true, email: true },
        });
        for (const u of users) {
          assigneeMap.set(u.id, { name: u.name, email: u.email });
        }
      }

      const taskIds = tasks.map((t) => t.id);
      const statsMap = await getTaskSessionStatsMap(taskIds);

      const fullTasks = tasks.map((t) => {
        const assignee = t.assigneeId ? assigneeMap.get(t.assigneeId) : null;
        const stats = statsMap.get(t.id);
        return {
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assigneeName: assignee?.name || assignee?.email || null,
          dueDate: t.dueDate,
          estimatedMinutes: t.estimatedMinutes ?? 60,
          totalSpentSeconds: stats?.totalSpentSeconds ?? 0,
          activeSessionStartedAt: stats?.activeSessionStartedAt ?? null,
        };
      });

      const markdown = buildTaskBoardMarkdown({
        teamName: team.name,
        projectName: projectObj?.name,
        tasks: fullTasks,
      });

      const structuredContent = {
        teamId: team.id,
        projectId: projectId || undefined,
        teamName: team.name,
        projectName: projectObj?.name,
        tasks: fullTasks,
      };

      const html = getTaskBoardUiHtml(structuredContent);

      return {
        content: [
          {
            type: "text",
            text: markdown,
          },
          {
            type: "resource",
            resource: {
              uri: "ui://tasks/kanban-board",
              mimeType: "text/html;profile=mcp-app",
              text: html,
            },
          },
        ],
        structuredContent,
      };
    },
  );

  // 8. get_active_tasks
  server.registerTool(
    "get_active_tasks",
    {
      description:
        "Query tasks currently in progress with active timer sessions across a team or user.",
      inputSchema: getActiveTasksSchema,
    },
    async ({ teamId, userId: userQuery }) => {
      const currentUser = await ctx.getCurrentUser();
      const [targetTeamIds, resolvedAssignee] = await Promise.all([
        teamId
          ? resolveAndVerifyTeam(teamId, currentUser.id).then((team) => [
              team.id,
            ])
          : TeamService.listUserTeams(currentUser.id).then((teams) =>
              teams.map((t) => t.id),
            ),
        userQuery
          ? resolveUserId(userQuery, currentUser.id, ctx)
          : Promise.resolve(undefined),
      ]);

      if (!teamId && targetTeamIds.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ activeTasks: [], count: 0 }, null, 2),
            },
          ],
        };
      }

      if (userQuery && !resolvedAssignee) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ activeTasks: [], count: 0 }, null, 2),
            },
          ],
        };
      }

      const inProgressTasks = await TaskService.listTasks({
        teamId: targetTeamIds.length === 1 ? targetTeamIds[0] : targetTeamIds,
        status: "in_progress",
        assigneeId: resolvedAssignee || undefined,
      });

      if (inProgressTasks.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ activeTasks: [], count: 0 }, null, 2),
            },
          ],
        };
      }

      const taskIds = inProgressTasks.map((t) => t.id);
      const statsMap = await getTaskSessionStatsMap(taskIds);

      const now = Date.now();
      const activeTasks = inProgressTasks
        .filter((t) => Boolean(statsMap.get(t.id)?.activeSessionStartedAt))
        .map((t) => {
          const stats = statsMap.get(t.id)!;
          const startedTime = parseTimestampMs(stats.activeSessionStartedAt);
          const elapsedSessionSeconds = Math.max(
            0,
            Math.floor((now - startedTime) / 1000),
          );
          const totalSpentSeconds =
            (stats.totalSpentSeconds || 0) + elapsedSessionSeconds;
          const estMinutes = t.estimatedMinutes ?? 60;
          const estSeconds = estMinutes * 60;
          const isOverBudget = totalSpentSeconds > estSeconds;
          const varianceSeconds = totalSpentSeconds - estSeconds;

          return {
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            teamId: t.teamId,
            projectId: t.projectId,
            assigneeId: t.assigneeId,
            dueDate: t.dueDate,
            estimatedMinutes: estMinutes,
            activeSessionStartedAt: stats.activeSessionStartedAt,
            elapsedSessionSeconds,
            totalSpentSeconds,
            budgetStatus: {
              estimatedMinutes: estMinutes,
              estimatedSeconds: estSeconds,
              totalSpentSeconds,
              isOverBudget,
              varianceSeconds,
            },
          };
        });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                activeTasks,
                count: activeTasks.length,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 9. get_task_timeline
  server.registerTool(
    "get_task_timeline",
    {
      description:
        "Retrieve the chronological work session history for a given task.",
      inputSchema: getTaskTimelineSchema,
    },
    async ({ taskId }) => {
      const currentUser = await ctx.getCurrentUser();
      const taskRecord = await TaskService.getTaskById(taskId);
      if (!taskRecord) {
        throw new Error(`Task with id '${taskId}' not found.`);
      }

      await resolveAndVerifyTeam(taskRecord.teamId, currentUser.id);

      const rawSessions = await TaskService.getTaskTimeSessions(taskId);

      const userIds = Array.from(
        new Set(
          rawSessions
            .map((s) => s.userId)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const userMap = new Map<
        string,
        { name: string | null; email: string | null }
      >();
      if (userIds.length > 0) {
        const users = await db.query.user.findMany({
          where: inArray(user.id, userIds),
          columns: { id: true, name: true, email: true },
        });
        for (const u of users) {
          userMap.set(u.id, { name: u.name, email: u.email });
        }
      }

      const now = Date.now();
      let cumulativeSpentSeconds = 0;

      const sessions = rawSessions.map((s) => {
        const sessionUser = s.userId ? userMap.get(s.userId) : null;
        let durationSeconds = s.durationSeconds || 0;
        const isActive = !s.endedAt;

        if (isActive) {
          durationSeconds = Math.max(
            0,
            Math.floor((now - new Date(s.startedAt).getTime()) / 1000),
          );
        }

        cumulativeSpentSeconds += durationSeconds;

        return {
          id: s.id,
          userId: s.userId,
          userName: sessionUser?.name || null,
          userEmail: sessionUser?.email || null,
          startedAt: s.startedAt.toISOString(),
          endedAt: s.endedAt ? s.endedAt.toISOString() : null,
          durationSeconds,
          isActive,
        };
      });

      const estMinutes = taskRecord.estimatedMinutes ?? 60;
      const estSeconds = estMinutes * 60;
      const budgetVarianceSeconds = cumulativeSpentSeconds - estSeconds;
      const isOverBudget = cumulativeSpentSeconds > estSeconds;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                task: {
                  id: taskRecord.id,
                  title: taskRecord.title,
                  status: taskRecord.status,
                  priority: taskRecord.priority,
                  estimatedMinutes: estMinutes,
                },
                sessions,
                sessionCount: sessions.length,
                totalSpentSeconds: cumulativeSpentSeconds,
                budgetVarianceSeconds,
                isOverBudget,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
