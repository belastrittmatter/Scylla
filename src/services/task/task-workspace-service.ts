import { parseDbTimestampToIso } from "@/components/tasks/task-utils";
import { db } from "@/db";
import {
  user,
  account,
  team,
  teamMember,
  project,
  task,
  taskComment,
  taskTimeSession,
  type User,
  type Project,
} from "@/db/schema";
import { eq, asc, desc, sql, inArray, or, and } from "drizzle-orm";
import { GithubIntegrationService } from "@/services/github/github-integration-service";
import type { TaskCommentItem } from "@/components/tasks/task-types";
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

export function toTaskUser(
  u: User,
  githubMeta?: { connected: boolean; username?: string | null },
): TaskUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    avatarUrl: u.image || "",
    initials: getInitials(u.name),
    role: u.role || "member",
    githubConnected: Boolean(githubMeta?.connected),
    githubUsername: githubMeta?.username || null,
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

    const [allUsersRaw, rawGithubAccounts] = await Promise.all([
      relevantUserIds.length > 0
        ? db
            .select()
            .from(user)
            .where(inArray(user.id, relevantUserIds))
            .orderBy(asc(user.name))
        : Promise.resolve([]),
      relevantUserIds.length > 0
        ? db
            .select({
              userId: account.userId,
              accountId: account.accountId,
            })
            .from(account)
            .where(
              and(
                inArray(account.userId, relevantUserIds),
                eq(account.providerId, "github"),
              ),
            )
        : Promise.resolve([]),
    ]);

    const ghAccountMap = new Map<string, string | null>(
      rawGithubAccounts.map((a) => [a.userId, a.accountId]),
    );

    const users = await Promise.all(
      allUsersRaw.map(async (u) => {
        const ghAccId = ghAccountMap.get(u.id);
        const isConnected = ghAccId !== undefined;
        let ghUsername: string | null = null;
        if (isConnected) {
          if (ghAccId && !/^\d+$/.test(ghAccId)) {
            ghUsername = ghAccId;
          } else if (u.email?.endsWith("@users.noreply.github.com")) {
            ghUsername = u.email.replace("@users.noreply.github.com", "");
          } else {
            ghUsername = await GithubIntegrationService.resolveGitHubUsername(
              u.id,
              currentUserId,
            );
          }
        }
        return toTaskUser(u, { connected: isConnected, username: ghUsername });
      }),
    );
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

  public static async getTaskComments(taskId: string, userId?: string) {
    const rows = await db
      .select({ comment: taskComment, user })
      .from(taskComment)
      .leftJoin(user, eq(taskComment.userId, user.id))
      .where(eq(taskComment.taskId, taskId))
      .orderBy(asc(taskComment.createdAt));

    const localComments: TaskCommentItem[] = rows.map((r) => ({
      ...r.comment,
      source: "local" as const,
      user: r.user ? toTaskUser(r.user) : null,
      htmlUrl: undefined,
      isSyncedToGithub: false,
    }));

    // Fetch GitHub Issue comments if task is linked to GitHub
    let ghComments: Awaited<
      ReturnType<typeof GithubIntegrationService.getIssueComments>
    > = [];
    try {
      ghComments = await GithubIntegrationService.getIssueComments(
        taskId,
        userId,
      );
    } catch {
      // non-blocking
    }

    // Merge and deduplicate comments between Scylla DB and GitHub
    const normalized = (str: string) => str.trim().replace(/\r\n/g, "\n");
    const matchedGhIds = new Set<string>();

    const mergedLocalComments: TaskCommentItem[] = localComments.map(
      (local) => {
        // Check if a GitHub comment matches this local comment:
        // 1. By stored githubCommentId
        // 2. Or by identical content within 24 hours
        const matchingGh = ghComments.find((gh) => {
          if (matchedGhIds.has(gh.id)) return false;
          if (
            local.githubCommentId &&
            (gh.id === `gh-${local.githubCommentId}` ||
              gh.id === local.githubCommentId)
          ) {
            return true;
          }
          if (normalized(local.content) === normalized(gh.content)) {
            const timeDiff = Math.abs(
              new Date(local.createdAt).getTime() -
                new Date(gh.createdAt).getTime(),
            );
            return timeDiff < 24 * 3600 * 1000;
          }
          return false;
        });

        if (matchingGh) {
          matchedGhIds.add(matchingGh.id);
          return {
            ...local,
            htmlUrl: matchingGh.htmlUrl,
            isSyncedToGithub: true,
          };
        }

        return local;
      },
    );

    // Only include GitHub comments that were NOT posted from Scylla (e.g. comments authored directly on GitHub)
    const externalGhComments: TaskCommentItem[] = ghComments
      .filter((gh) => !matchedGhIds.has(gh.id))
      .map((gh) => ({
        ...gh,
        githubCommentId: gh.id.replace(/^gh-/, ""),
        isSyncedToGithub: true,
        user: gh.user
          ? {
              ...gh.user,
              email: gh.user.email || "",
              role: "member",
            }
          : null,
      }));

    const all = [...mergedLocalComments, ...externalGhComments];
    all.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    return all;
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

    // Also mirror comment to GitHub Issue if task is linked
    let ghCommentResult: { id?: number; htmlUrl?: string } | null = null;
    try {
      const ghRes = await GithubIntegrationService.createIssueComment(
        payload.taskId,
        payload.content.trim(),
        payload.userId,
      );
      if (ghRes.success && ghRes.id) {
        ghCommentResult = ghRes;
        await db
          .update(taskComment)
          .set({ githubCommentId: String(ghRes.id) })
          .where(eq(taskComment.id, inserted.id));
      }
    } catch (err) {
      console.warn("Could not sync comment to GitHub Issue:", err);
    }

    return {
      ...inserted,
      githubCommentId: ghCommentResult?.id
        ? String(ghCommentResult.id)
        : inserted.githubCommentId,
      htmlUrl: ghCommentResult?.htmlUrl,
      source: "local" as const,
      user: commentUser ? toTaskUser(commentUser) : null,
    };
  }
}
