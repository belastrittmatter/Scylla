import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account, project, user, type Project } from "@/db/schema";
import { TeamService } from "@/services/team/team-service";
import { checkAssigneeGithubRule } from "./task-rules";

/** Thrown when a task in a GitHub-linked project is assigned to a member without GitHub. */
export class TaskAssigneeGithubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskAssigneeGithubError";
  }
}

export async function assertAssigneeGithubRule(
  projectId: string | null | undefined,
  assigneeId: string | null | undefined,
): Promise<void> {
  if (!projectId || !assigneeId) return;
  const [projectRow, githubRow, userRow] = await Promise.all([
    db.query.project.findFirst({
      where: eq(project.id, projectId),
      columns: { githubRepo: true },
    }),
    db.query.account.findFirst({
      where: and(
        eq(account.userId, assigneeId),
        eq(account.providerId, "github"),
      ),
      columns: { id: true },
    }),
    db.query.user.findFirst({
      where: eq(user.id, assigneeId),
      columns: { name: true },
    }),
  ]);
  const result = checkAssigneeGithubRule({
    projectGithubRepo: projectRow?.githubRepo,
    assigneeId,
    assigneeHasGithub: githubRow !== undefined,
    assigneeName: userRow?.name,
  });
  if (!result.allowed) throw new TaskAssigneeGithubError(result.reason);
}

export function assertProjectInTeam(
  projectRecord: Project | null | undefined,
  projectId: string,
  teamId: string,
): void {
  if (!projectRecord || projectRecord.teamId !== teamId) {
    throw new Error(
      `Project with id "${projectId}" not found in team "${teamId}"`,
    );
  }
}

export async function assertAssigneeInTeam(
  teamId: string,
  assigneeId: string,
): Promise<void> {
  if (!(await TeamService.isTeamMember(teamId, assigneeId))) {
    throw new Error(`User "${assigneeId}" is not a member of team "${teamId}"`);
  }
}
