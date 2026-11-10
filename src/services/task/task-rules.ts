/**
 * Task transition and permission validation rules.
 * Enforces Git workflow conventions and role-based permissions when moving cards.
 */

export interface TaskTransitionCheckParams {
  task: {
    id: string;
    title?: string;
    status: string;
    assigneeId?: string | null;
    creatorId?: string | null;
    githubIssueNumber?: number | null;
    githubBranch?: string | null;
    githubPrNumber?: number | null;
    githubPrStatus?: string | null;
    project?: {
      githubRepo?: string | null;
    } | null;
  };
  targetStatus: string;
  currentUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  currentTeamRole?: string | null;
  isProjectLinkedToGithub?: boolean;
}

export interface TaskTransitionCheckResult {
  allowed: boolean;
  reason?: string;
  autoAssignCurrentUserId?: string;
}

/**
 * Validates whether a task status transition is permitted according to
 * permissions and Git workflow rules.
 */
export function validateTaskTransitionRule({
  task,
  targetStatus,
  currentUser,
  currentTeamRole,
  isProjectLinkedToGithub = false,
}: TaskTransitionCheckParams): TaskTransitionCheckResult {
  // 1. Same status (e.g. reordering within same column) is always permitted
  if (task.status === targetStatus) {
    return { allowed: true };
  }

  const isAssignee = Boolean(
    currentUser?.id && task.assigneeId && task.assigneeId === currentUser.id,
  );
  const isCreator = Boolean(
    currentUser?.id && task.creatorId && task.creatorId === currentUser.id,
  );
  const isAdminOrOwner =
    currentTeamRole === "admin" || currentTeamRole === "owner";

  // 2. Permission Check:
  // - Assignee, Creator, and Team Admin/Owner can always move tasks.
  // - If task has no assignee and is being dragged to "in_progress", any member can claim it.
  // - Otherwise, a member cannot move someone else's task.
  if (currentUser?.id) {
    const isUnassignedClaim =
      !task.assigneeId && targetStatus === "in_progress";
    if (!isAssignee && !isCreator && !isAdminOrOwner && !isUnassignedClaim) {
      return {
        allowed: false,
        reason:
          "You do not have permission to change this task's status. Only the assignee or project admins can update it.",
      };
    }
  }

  // 3. Git Workflow Transition Rules
  // Applied when the project is linked to GitHub or the task itself has Git metadata
  const hasGitLink = Boolean(
    isProjectLinkedToGithub ||
    task.project?.githubRepo?.trim() ||
    task.githubIssueNumber ||
    task.githubBranch ||
    task.githubPrNumber,
  );

  if (hasGitLink) {
    // Rule A: Transitioning to 'in_review'
    // In Review requires code ready for review (either a branch or a pull request)
    if (targetStatus === "in_review") {
      const hasCodeArtifact = Boolean(task.githubBranch || task.githubPrNumber);
      if (!hasCodeArtifact) {
        return {
          allowed: false,
          reason:
            "Git Rule: Task requires a linked Git branch or Pull Request on GitHub before moving to 'In Review'.",
        };
      }
    }

    // Rule B: Transitioning to 'done'
    // If a Pull Request exists for this task, it must be merged before task can be marked Done
    if (targetStatus === "done") {
      if (
        task.githubPrNumber &&
        task.githubPrStatus &&
        task.githubPrStatus !== "merged"
      ) {
        return {
          allowed: false,
          reason: `Git Rule: Pull Request #${task.githubPrNumber} is currently "${task.githubPrStatus}". Please merge the Pull Request on GitHub before completing the task.`,
        };
      }
    }
  }

  // Auto-assign task if picked up into in_progress by current user
  let autoAssignCurrentUserId: string | undefined;
  if (targetStatus === "in_progress" && !task.assigneeId && currentUser?.id) {
    autoAssignCurrentUserId = currentUser.id;
  }

  return {
    allowed: true,
    autoAssignCurrentUserId,
  };
}
