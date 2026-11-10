import { db, project, teamMember } from "@/db";
import { eq, and } from "drizzle-orm";
import { TeamService } from "@/services/team/team-service";
import { TaskService } from "@/services/task/task-service";

export async function checkTaskStatusTransitionAllowed(
  taskId: string,
  targetStatus: string,
  userId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const existingTask = await TaskService.getTaskById(taskId);
  if (!existingTask) {
    return { allowed: false, reason: "Task not found" };
  }
  const isMember = await TeamService.isTeamMember(existingTask.teamId, userId);
  if (!isMember) {
    return { allowed: false, reason: "Access denied" };
  }

  let isProjectLinkedToGithub = false;
  if (existingTask.projectId) {
    const [proj] = await db
      .select()
      .from(project)
      .where(eq(project.id, existingTask.projectId))
      .limit(1);
    isProjectLinkedToGithub = Boolean(proj?.githubRepo?.trim());
  }

  let userTeamRole: string | undefined;
  if (userId && existingTask.teamId) {
    const [memberRow] = await db
      .select()
      .from(teamMember)
      .where(
        and(
          eq(teamMember.teamId, existingTask.teamId),
          eq(teamMember.userId, userId),
        ),
      )
      .limit(1);
    userTeamRole = memberRow?.role;
  }

  const { validateTaskTransitionRule } =
    await import("@/services/task/task-rules");
  const validation = validateTaskTransitionRule({
    task: {
      ...existingTask,
      project: existingTask.project
        ? { githubRepo: isProjectLinkedToGithub ? "linked" : null }
        : null,
    },
    targetStatus,
    currentUser: userId ? { id: userId } : null,
    currentTeamRole: userTeamRole,
    isProjectLinkedToGithub,
  });

  if (!validation.allowed) {
    return {
      allowed: false,
      reason: validation.reason || "Status transition not allowed by rules",
    };
  }

  return { allowed: true };
}

export async function handleProjectGithubSetup(
  projectName: string,
  projectDescription: string | null | undefined,
  createNewRepo: { name: string; description?: string; isPrivate?: boolean },
  userId: string,
): Promise<string> {
  const { validateGithubRepoName } = await import("@/lib/github-validation");
  const validation = validateGithubRepoName(createNewRepo.name);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid GitHub repository name");
  }

  const { GithubSyncService } =
    await import("@/services/github/github-sync-service");
  const createdRepo = await GithubSyncService.createAndSetupRepository(
    {
      name: validation.cleanName,
      description: createNewRepo.description || projectDescription || undefined,
      isPrivate: createNewRepo.isPrivate,
      projectName,
    },
    userId,
  );

  return createdRepo.fullName;
}
