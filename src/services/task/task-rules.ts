/** Pure task rules: no database, no network; safe to import from client code. */

/** Thrown when a task would be assigned to a member without a GitHub connection in a GitHub-linked project. */
export class TaskAssigneeGithubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskAssigneeGithubError";
  }
}

export function assigneeGithubRequiredMessage(
  assigneeName?: string | null,
): string {
  const name = assigneeName?.trim() || "The selected member";
  return `Cannot assign task: ${name} has not connected their GitHub account. Members must connect GitHub in Account Settings before they can be assigned tasks in a GitHub-linked project.`;
}

/** False only for a GitHub-linked project and an assignee without a GitHub connection. */
export function isAssigneeAllowed(input: {
  projectGithubRepo: string | null | undefined;
  assigneeGithubConnected: boolean;
}): boolean {
  const linked = !!input.projectGithubRepo?.trim();
  return !linked || input.assigneeGithubConnected;
}
