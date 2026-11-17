import type { TaskUser } from "./task-types";

export interface AssigneeGithubStatus {
  blocked: boolean;
  badge: string | null;
  tooltip: string | null;
}

/** githubConnected === false is "not connected"; undefined is unknown and never blocks. */
export function getAssigneeGithubStatus(
  user: Pick<TaskUser, "name" | "githubConnected">,
  requireGithub: boolean,
): AssigneeGithubStatus {
  if (!requireGithub || user.githubConnected !== false) {
    return { blocked: false, badge: null, tooltip: null };
  }
  return {
    blocked: true,
    badge: "No GitHub",
    tooltip: `${user.name} has not connected GitHub. Members must connect GitHub in Account Settings before they can be assigned tasks in this project.`,
  };
}
