import { db } from "@/db";
import { task, project, teamMember, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { validateTaskTransitionRule } from "./task-rules";

/**
 * Server-only helper to validate a task status transition against the database and active workflow rules.
 */
export async function checkTaskTransitionAllowed(
  taskId: string,
  targetStatus: string,
  userId: string | null,
): Promise<{ allowed: boolean; reason?: string }> {
  const [existingTask] = await db
    .select()
    .from(task)
    .where(eq(task.id, taskId))
    .limit(1);

  if (!existingTask || targetStatus === existingTask.status) {
    return { allowed: true };
  }

  let isProjectLinkedToGithub = false;
  if (existingTask.projectId) {
    const [proj] = await db
      .select({ githubRepo: project.githubRepo })
      .from(project)
      .where(eq(project.id, existingTask.projectId))
      .limit(1);
    isProjectLinkedToGithub = Boolean(proj?.githubRepo?.trim());
  }

  let currentTeamRole: string | null = null;
  let currentUserProfile = null;
  if (userId) {
    const [userRecord] = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (userRecord) {
      currentUserProfile = userRecord;
    }
    if (existingTask.teamId) {
      const [membership] = await db
        .select({ role: teamMember.role })
        .from(teamMember)
        .where(
          and(
            eq(teamMember.teamId, existingTask.teamId),
            eq(teamMember.userId, userId),
          ),
        )
        .limit(1);
      currentTeamRole = membership?.role ?? null;
    }
  }

  const result = validateTaskTransitionRule({
    task: existingTask,
    targetStatus,
    currentUser: currentUserProfile,
    currentTeamRole,
    isProjectLinkedToGithub,
  });

  return {
    allowed: result.allowed,
    reason: result.reason,
  };
}
