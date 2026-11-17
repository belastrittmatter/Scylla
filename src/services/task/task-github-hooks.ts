import { eq } from "drizzle-orm";
import { db } from "@/db";
import { project, task, type Task } from "@/db/schema";
import {
  GithubIntegrationService,
  type TaskGithubChanges,
} from "@/services/github/github-integration-service";
import type { UpdateTaskInput } from "./task-types";

/**
 * Creates the GitHub issue for a task in a linked project and returns the row
 * as stored afterwards. GitHub errors never fail the task.
 */
export async function createIssueIfLinked(
  created: Task,
  userId?: string | null,
): Promise<Task> {
  if (!created.projectId) return created;
  try {
    const projectRow = await db.query.project.findFirst({
      where: eq(project.id, created.projectId),
      columns: { githubRepo: true },
    });
    if (!projectRow?.githubRepo?.trim()) return created;
    const issue = await GithubIntegrationService.createIssueForTask(
      created.id,
      userId ?? undefined,
    );
    if (!issue) return created;
    const [fresh] = await db.select().from(task).where(eq(task.id, created.id));
    return fresh ?? created;
  } catch (err) {
    console.warn("GitHub issue creation failed:", err);
    return created;
  }
}

/** Pushes title, description, status and priority changes to the linked issue. */
export async function pushTaskChangesToGithub(
  existing: Task,
  updated: Task,
  input: UpdateTaskInput,
  userId: string,
): Promise<void> {
  if (updated.githubIssueNumber == null) return;
  const changes: TaskGithubChanges = {};
  if (input.title !== undefined && input.title !== existing.title)
    changes.title = input.title;
  if (
    input.description !== undefined &&
    input.description !== existing.description
  )
    changes.description = input.description;
  if (input.status !== undefined && input.status !== existing.status)
    changes.status = input.status;
  if (input.priority !== undefined && input.priority !== existing.priority)
    changes.priority = input.priority;
  if (Object.keys(changes).length === 0) return;
  try {
    await GithubIntegrationService.syncTaskToGitHub(
      updated.id,
      changes,
      userId,
    );
  } catch (err) {
    console.warn("GitHub task sync failed:", err);
  }
}
