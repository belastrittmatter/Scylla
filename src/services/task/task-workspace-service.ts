import { parseDbTimestampToIso } from "@/components/tasks/task-utils";
import { db } from "@/db";
import {
  user,
  team,
  teamMember,
  project,
  task,
  taskComment,
  taskTimeSession,
  type User,
  type Project,
} from "@/db/schema";
import { eq, asc, desc, sql, inArray, or } from "drizzle-orm";
import type {
  TaskUser,
  TaskWithDetails,
  WorkspaceData,
  WorkspaceTeamMember,
} from "./workspace-types";

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function toTaskUser(u: User): TaskUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    avatarUrl: u.image || "",
    initials: getInitials(u.name),
    role: u.role || "member",
  };
}

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

    const users = allUsersRaw.map(toTaskUser);
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

  public static async getTaskComments(taskId: string) {
    const rows = await db
      .select({ comment: taskComment, user })
      .from(taskComment)
      .leftJoin(user, eq(taskComment.userId, user.id))
      .where(eq(taskComment.taskId, taskId))
      .orderBy(asc(taskComment.createdAt));

    return rows.map((r) => ({
      ...r.comment,
      user: r.user ? toTaskUser(r.user) : null,
    }));
  }

  public static async createTaskComment(payload: {
    taskId: string;
    userId: string;
    content: string;
  }) {
    const [[inserted], [commentUser]] = await Promise.all([
      db
        .insert(taskComment)
        .values({
          taskId: payload.taskId,
          userId: payload.userId,
          content: payload.content.trim(),
        })
        .returning(),
      db.select().from(user).where(eq(user.id, payload.userId)).limit(1),
    ]);

    return {
      ...inserted,
      user: commentUser ? toTaskUser(commentUser) : null,
    };
  }
}
