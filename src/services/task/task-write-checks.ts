import { db } from "@/db";
import { project, task, user, type Task } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GithubAuthService } from "@/services/github/github-auth-service";
import type { UpdateTaskInput } from "./task-types";
import {
  TaskAssigneeGithubError,
  assigneeGithubRequiredMessage,
  isAssigneeAllowed,
} from "./task-rules";

/** Thrown when a task's startDate is later than its dueDate. */
export class TaskDateRangeError extends Error {
  constructor() {
    super("startDate must be on or before dueDate");
    this.name = "TaskDateRangeError";
  }
}

/** Both dates set → start must not be after due; a null/absent date imposes no constraint. */
export function assertDateOrder(
  start: Date | null | undefined,
  due: Date | null | undefined,
): void {
  if (start && due && start.getTime() > due.getTime()) {
    throw new TaskDateRangeError();
  }
}

/** In a GitHub-linked project the assignee must have connected GitHub. */
export async function assertAssigneeGithubAllowed(
  assigneeId: string,
  projectGithubRepo: string | null | undefined,
): Promise<void> {
  if (!projectGithubRepo?.trim()) return;
  const connected = await GithubAuthService.isConnected(assigneeId);
  if (
    isAssigneeAllowed({ projectGithubRepo, assigneeGithubConnected: connected })
  ) {
    return;
  }
  const assignee = await db.query.user.findFirst({
    where: eq(user.id, assigneeId),
    columns: { name: true },
  });
  throw new TaskAssigneeGithubError(
    assigneeGithubRequiredMessage(assignee?.name),
  );
}

type ProjectRow = typeof project.$inferSelect;

/**
 * On update: when the assignee or the project changes, the effective assignee
 * must be allowed on the effective project. Untouched placements are never rejected.
 */
export async function assertAssigneePlacementAllowed(
  existing: Pick<Task, "assigneeId" | "projectId">,
  input: Pick<UpdateTaskInput, "assigneeId" | "projectId">,
  loadedProject: ProjectRow | undefined,
): Promise<void> {
  const assigneeId =
    input.assigneeId !== undefined ? input.assigneeId : existing.assigneeId;
  const projectId =
    input.projectId !== undefined ? input.projectId : existing.projectId;
  const changed =
    assigneeId !== existing.assigneeId || projectId !== existing.projectId;
  if (!changed || !assigneeId) return;
  const effectiveProject =
    loadedProject ??
    (projectId
      ? await db.query.project.findFirst({ where: eq(project.id, projectId) })
      : undefined);
  await assertAssigneeGithubAllowed(assigneeId, effectiveProject?.githubRepo);
}

/** Only the fields present in the update input (undefined = untouched). */
export function buildTaskUpdateData(
  input: UpdateTaskInput,
): Partial<typeof task.$inferInsert> {
  const data: Partial<typeof task.$inferInsert> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.projectId !== undefined) data.projectId = input.projectId;
  if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate;
  if (input.startDate !== undefined) data.startDate = input.startDate;
  if (input.position !== undefined) data.position = input.position;
  if (input.estimatedMinutes !== undefined)
    data.estimatedMinutes = input.estimatedMinutes;
  return data;
}

/** The project must exist and belong to the task's team. */
export function assertProjectInTeam(
  projectRecord: Pick<ProjectRow, "teamId"> | null | undefined,
  projectId: string,
  teamId: string,
): void {
  if (!projectRecord || projectRecord.teamId !== teamId) {
    throw new Error(
      `Project with id "${projectId}" not found in team "${teamId}"`,
    );
  }
}
