import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { task, taskComment, user } from "@/db/schema";
import { GithubIntegrationService } from "@/services/github/github-integration-service";
import type { GithubIssueComment } from "@/services/github/github-types";
import { toTaskUser } from "./task-workspace-service";
import type { TaskCommentWithSource, TaskUser } from "./workspace-types";

function githubAuthor(gh: GithubIssueComment): TaskUser {
  const { login, avatarUrl } = gh.author;
  return {
    id: `github:${login}`,
    name: login,
    email: "",
    image: avatarUrl,
    avatarUrl: avatarUrl ?? "",
    initials: login.slice(0, 2).toUpperCase(),
    role: "github",
  };
}

async function hasLinkedIssue(taskId: string): Promise<boolean> {
  const row = await db.query.task.findFirst({
    where: eq(task.id, taskId),
    columns: { githubIssueNumber: true },
  });
  return row?.githubIssueNumber != null;
}

/** Local comments merged with the linked issue's comments, oldest first. */
export async function listTaskComments(
  taskId: string,
  userId?: string,
): Promise<TaskCommentWithSource[]> {
  const [rows, ghComments] = await Promise.all([
    db
      .select({ comment: taskComment, user })
      .from(taskComment)
      .leftJoin(user, eq(taskComment.userId, user.id))
      .where(eq(taskComment.taskId, taskId))
      .orderBy(asc(taskComment.createdAt)),
    GithubIntegrationService.listIssueComments(taskId, userId),
  ]);
  const ghById = new Map(ghComments.map((gh) => [gh.id, gh]));
  const localIds = new Set(rows.map((r) => r.comment.githubCommentId));

  const local = rows.map((r): TaskCommentWithSource => ({
    ...r.comment,
    user: r.user ? toTaskUser(r.user) : null,
    source: "local",
    htmlUrl: ghById.get(r.comment.githubCommentId ?? "")?.htmlUrl ?? null,
  }));
  const remote = ghComments
    .filter((gh) => !localIds.has(gh.id))
    .map((gh): TaskCommentWithSource => ({
      id: `github-${gh.id}`,
      taskId,
      userId: "",
      content: gh.body,
      githubCommentId: gh.id,
      createdAt: new Date(gh.createdAt),
      updatedAt: new Date(gh.updatedAt),
      user: githubAuthor(gh),
      source: "github",
      htmlUrl: gh.htmlUrl,
    }));
  return [...local, ...remote].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
}

/** Stores the comment locally and mirrors it to the linked issue when there is one. */
export async function addTaskComment(payload: {
  taskId: string;
  userId: string;
  content: string;
}): Promise<TaskCommentWithSource> {
  const content = payload.content.trim();
  const [[inserted], [commentUser]] = await Promise.all([
    db
      .insert(taskComment)
      .values({ taskId: payload.taskId, userId: payload.userId, content })
      .returning(),
    db.select().from(user).where(eq(user.id, payload.userId)).limit(1),
  ]);

  let stored = inserted;
  let htmlUrl: string | null = null;
  if (await hasLinkedIssue(payload.taskId)) {
    const posted = await GithubIntegrationService.createIssueComment(
      payload.taskId,
      content,
      payload.userId,
    ).catch(() => null);
    if (posted) {
      [stored] = await db
        .update(taskComment)
        .set({ githubCommentId: posted.id })
        .where(eq(taskComment.id, inserted.id))
        .returning();
      htmlUrl = posted.htmlUrl;
    }
  }
  return {
    ...stored,
    user: commentUser ? toTaskUser(commentUser) : null,
    source: "local",
    htmlUrl,
  };
}
