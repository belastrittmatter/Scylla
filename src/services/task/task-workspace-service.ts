import { parseDbTimestampToIso } from "@/components/tasks/task-utils";
import { db } from "@/db";
import {
  user,
  team,
  teamMember,
  project,
  task,
  taskTimeSession,
  type Project,
} from "@/db/schema";
import { eq, asc, desc, sql, inArray, or } from "drizzle-orm";
import type {
  TaskCommentView,
  TaskUser,
  TaskWithDetails,
  WorkspaceData,
  WorkspaceTeamMember,
} from "./workspace-types";
import { toTaskUser } from "./task-user";
import { TaskCommentService } from "./task-comment-service";
import { GithubAuthService } from "@/services/github/github-auth-service";

export { toTaskUser };

export class TaskWorkspaceService {
  public static async getWorkspaceData(
    currentUserId?: string,
  ): Promise<WorkspaceData> {
    if (!currentUserId) {
      return {
        teams: [],
        projects: [],
        tasks: [],
        users: [],
        teamMembers: [],
      };
    }

    // 1. Resolve teams where user is an owner or member
    const userMemberships = await db
      .select({ teamId: teamMember.teamId })
      .from(teamMember)
      .where(eq(teamMember.userId, currentUserId));

    const memberTeamIds = userMemberships.map((m) => m.teamId);

    const teams = await db
      .select()
      .from(team)
      .where(
        memberTeamIds.length > 0
          ? or(eq(team.ownerId, currentUserId), inArray(team.id, memberTeamIds))
          : eq(team.ownerId, currentUserId),
      )
      .orderBy(asc(team.name));

    if (teams.length === 0) {
      return {
        teams: [],
        projects: [],
        tasks: [],
        users: [],
        teamMembers: [],
      };
    }

    const teamIds = teams.map((t) => t.id);

    // 2. Fetch projects, tasks, and team members strictly scoped to the user's teams
    const [projects, rawTasks, rawTeamMembers] = await Promise.all([
      db
        .select()
        .from(project)
        .where(inArray(project.teamId, teamIds))
        .orderBy(asc(project.name)),
      db
        .select()
        .from(task)
        .where(inArray(task.teamId, teamIds))
        .orderBy(asc(task.position), desc(task.createdAt)),
      db.select().from(teamMember).where(inArray(teamMember.teamId, teamIds)),
    ]);

    // 3. Fetch session stats only for the scoped tasks
    const taskIds = rawTasks.map((t) => t.id);
    const rawSessionStats =
      taskIds.length > 0
        ? await db
            .select({
              taskId: taskTimeSession.taskId,
              totalSpentSeconds: sql<number>`COALESCE(SUM(CASE WHEN ${taskTimeSession.endedAt} IS NOT NULL THEN ${taskTimeSession.durationSeconds} ELSE 0 END), 0)::int`,
              activeSessionStartedAt: sql<
                string | null
              >`MAX(CASE WHEN ${taskTimeSession.endedAt} IS NULL THEN ${taskTimeSession.startedAt} AT TIME ZONE 'UTC' ELSE NULL END)`,
            })
            .from(taskTimeSession)
            .where(inArray(taskTimeSession.taskId, taskIds))
            .groupBy(taskTimeSession.taskId)
        : [];

    // 4. Fetch only users who are members/owners of these teams or creators/assignees of these tasks
    const relevantUserIds = Array.from(
      new Set([
        currentUserId,
        ...teams.map((t) => t.ownerId),
        ...rawTeamMembers.map((m) => m.userId),
        ...rawTasks.map((t) => t.creatorId).filter(Boolean),
        ...rawTasks.map((t) => t.assigneeId).filter(Boolean),
      ] as string[]),
    );

    const allUsersRaw =
      relevantUserIds.length > 0
        ? await db
            .select()
            .from(user)
            .where(inArray(user.id, relevantUserIds))
            .orderBy(asc(user.name))
        : [];

    const connected =
      await GithubAuthService.getConnectedUserIds(relevantUserIds);
    const users = allUsersRaw.map((u) => ({
      ...toTaskUser(u),
      githubConnected: connected.has(u.id),
    }));
    const userMap = new Map<string, TaskUser>(users.map((u) => [u.id, u]));
    const projectMap = new Map<string, Project>(projects.map((p) => [p.id, p]));

    const taskStatsMap = new Map<
      string,
      { totalSpentSeconds: number; activeSessionStartedAt: string | null }
    >(
      rawSessionStats.map((s) => [
        s.taskId,
        {
          totalSpentSeconds: Number(s.totalSpentSeconds) || 0,
          activeSessionStartedAt: parseDbTimestampToIso(
            s.activeSessionStartedAt,
          ),
        },
      ]),
    );

    const tasks: TaskWithDetails[] = rawTasks.map((t) => {
      const stats = taskStatsMap.get(t.id);
      return {
        ...t,
        assignee: t.assigneeId ? userMap.get(t.assigneeId) || null : null,
        creator: t.creatorId ? userMap.get(t.creatorId) || null : null,
        project: t.projectId ? projectMap.get(t.projectId) || null : null,
        totalSpentSeconds: stats?.totalSpentSeconds ?? 0,
        activeSessionStartedAt: stats?.activeSessionStartedAt ?? null,
      };
    });

    const teamMembers: WorkspaceTeamMember[] = rawTeamMembers.map((tm) => ({
      id: tm.id,
      teamId: tm.teamId,
      userId: tm.userId,
      role: tm.role,
    }));

    for (const t of teams) {
      if (
        t.ownerId &&
        !teamMembers.some((tm) => tm.teamId === t.id && tm.userId === t.ownerId)
      ) {
        teamMembers.push({
          id: `owner-${t.id}-${t.ownerId}`,
          teamId: t.id,
          userId: t.ownerId,
          role: "owner",
        });
      }
    }

    return { teams, projects, tasks, users, teamMembers };
  }

  public static getTaskComments(
    taskId: string,
    userId?: string,
  ): Promise<TaskCommentView[]> {
    return TaskCommentService.getTaskComments(taskId, userId);
  }

  public static createTaskComment(payload: {
    taskId: string;
    userId: string;
    content: string;
  }): Promise<TaskCommentView> {
    return TaskCommentService.createTaskComment(payload);
  }
}
