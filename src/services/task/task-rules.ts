export interface AssigneeGithubRuleInput {
  projectGithubRepo: string | null | undefined;
  assigneeId: string | null | undefined;
  assigneeHasGithub: boolean;
  assigneeName?: string | null;
}

export type AssigneeGithubRuleResult =
  { allowed: true } | { allowed: false; reason: string };

export function assigneeGithubRequiredMessage(name?: string | null): string {
  return `Cannot assign task: ${name || "This member"} has not connected a GitHub account. Members must connect GitHub in Account Settings before they can be assigned tasks in a project linked to GitHub.`;
}

/** In a GitHub-linked project, only members with a GitHub connection can be assigned. */
export function checkAssigneeGithubRule(
  input: AssigneeGithubRuleInput,
): AssigneeGithubRuleResult {
  if (!input.projectGithubRepo?.trim()) return { allowed: true };
  if (!input.assigneeId) return { allowed: true };
  if (input.assigneeHasGithub) return { allowed: true };
  return {
    allowed: false,
    reason: assigneeGithubRequiredMessage(input.assigneeName),
  };
}

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

/** The new value, or the current one when the update leaves the field out. */
export function keepIfUnset<T>(next: T | undefined, current: T): T {
  return next !== undefined ? next : current;
}
