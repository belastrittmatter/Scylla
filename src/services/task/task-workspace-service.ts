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
import { eq, asc, desc, sql } from "drizzle-orm";
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
    _currentUserId?: string,
  ): Promise<WorkspaceData> {
    const teams = await db.select().from(team).orderBy(asc(team.name));

    const [projects, allUsersRaw, rawTasks, rawTeamMembers, rawSessionStats] =
      await Promise.all([
        db.select().from(project).orderBy(asc(project.name)),
        db.select().from(user).orderBy(asc(user.name)),
        db
          .select()
          .from(task)
          .orderBy(asc(task.position), desc(task.createdAt)),
        db.select().from(teamMember),
        db
          .select({
            taskId: taskTimeSession.taskId,
            totalSpentSeconds: sql<number>`COALESCE(SUM(CASE WHEN ${taskTimeSession.endedAt} IS NOT NULL THEN ${taskTimeSession.durationSeconds} ELSE 0 END), 0)::int`,
            activeSessionStartedAt: sql<
              string | null
            >`MAX(CASE WHEN ${taskTimeSession.endedAt} IS NULL THEN ${taskTimeSession.startedAt} AT TIME ZONE 'UTC' ELSE NULL END)`,
          })
          .from(taskTimeSession)
          .groupBy(taskTimeSession.taskId),
      ]);
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
