import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { taskComment, user } from "@/db/schema";
import {
  GithubCommentService,
  type GithubIssueComment,
} from "@/services/github/github-comment-service";
import { toTaskUser } from "./task-user";
import type { TaskCommentView } from "./workspace-types";

function toGithubView(taskId: string, c: GithubIssueComment): TaskCommentView {
  const userId = `gh-user-${c.author?.id ?? "unknown"}`;
  const login = c.author?.login;
  const avatar = c.author?.avatarUrl;
  return {
    id: `gh-${c.id}`,
    taskId,
    userId,
    content: c.body,
    githubCommentId: String(c.id),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    source: "github",
    htmlUrl: c.htmlUrl,
    user: {
      id: userId,
      name: login ?? "GitHub user",
      email: "",
      image: avatar ?? null,
      avatarUrl: avatar ?? "",
      initials: (login ?? "").slice(0, 2).toUpperCase(),
      role: "github",
      githubConnected: true,
    },
  };
}

export class TaskCommentService {
  static async getTaskComments(
    taskId: string,
    userId?: string,
  ): Promise<TaskCommentView[]> {
    const rows = await db
      .select({ comment: taskComment, user })
      .from(taskComment)
      .leftJoin(user, eq(taskComment.userId, user.id))
      .where(eq(taskComment.taskId, taskId))
      .orderBy(asc(taskComment.createdAt));

    const local: TaskCommentView[] = rows.map((r) => ({
      ...r.comment,
      user: r.user ? toTaskUser(r.user) : null,
      source: "local",
      htmlUrl: null,
    }));

    const remote = await GithubCommentService.listIssueComments(taskId, userId);
    const known = new Set(
      local.map((c) => c.githubCommentId).filter((id) => id !== null),
    );
    const merged = [
      ...local,
      ...remote
        .filter((c) => !known.has(String(c.id)))
        .map((c) => toGithubView(taskId, c)),
    ];
    return merged.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  static async createTaskComment(payload: {
    taskId: string;
    userId: string;
    content: string;
  }): Promise<TaskCommentView> {
    const content = payload.content.trim();
    const [[inserted], [commentUser]] = await Promise.all([
      db
        .insert(taskComment)
        .values({ taskId: payload.taskId, userId: payload.userId, content })
        .returning(),
      db.select().from(user).where(eq(user.id, payload.userId)).limit(1),
    ]);

    const posted = await GithubCommentService.createIssueComment(
      payload.taskId,
      content,
      payload.userId,
    );
    let githubCommentId: string | null = null;
    if (posted) {
      githubCommentId = String(posted.id);
      await db
        .update(taskComment)
        .set({ githubCommentId })
        .where(eq(taskComment.id, inserted.id));
    }

    return {
      ...inserted,
      githubCommentId,
      user: commentUser ? toTaskUser(commentUser) : null,
      source: "local",
      htmlUrl: posted?.htmlUrl ?? null,
    };
  }
}
