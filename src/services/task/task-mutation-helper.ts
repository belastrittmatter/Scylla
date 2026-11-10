import type { UpdateTaskInput, CreateTaskInput } from "./task-types";
import { assertAssigneeGithubLinked } from "./task-assignee-rules";
import { db } from "@/db";
import { project, task } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function validateCreateTaskGithubRules(
  assigneeId?: string | null,
  githubRepo?: string | null,
): Promise<void> {
  if (assigneeId && githubRepo) {
    await assertAssigneeGithubLinked(assigneeId, githubRepo);
  }
}

export async function validateUpdateTaskGithubRules(
  assigneeId?: string | null,
  targetProjectId?: string | null,
): Promise<void> {
  if (!assigneeId || !targetProjectId) return;
  const proj = await db.query.project.findFirst({
    where: eq(project.id, targetProjectId),
  });
  if (proj?.githubRepo) {
    await assertAssigneeGithubLinked(assigneeId, proj.githubRepo);
  }
}

export function populateTaskGithubFields(
  target: Partial<typeof task.$inferInsert>,
  input: UpdateTaskInput | CreateTaskInput,
): void {
  if (input.githubIssueNumber !== undefined)
    target.githubIssueNumber = input.githubIssueNumber;
  if (input.githubIssueUrl !== undefined)
    target.githubIssueUrl = input.githubIssueUrl;
  if (input.githubBranch !== undefined)
    target.githubBranch = input.githubBranch;
  if (input.githubPrNumber !== undefined)
    target.githubPrNumber = input.githubPrNumber;
  if (input.githubPrUrl !== undefined) target.githubPrUrl = input.githubPrUrl;
  if (input.githubPrStatus !== undefined)
    target.githubPrStatus = input.githubPrStatus;
}
