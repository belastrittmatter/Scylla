import { db } from "@/db";
import { project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TeamService } from "@/services/team/team-service";
import { TaskService } from "./task-service";

export async function assertTaskCreationAccess(
  teamId: string,
  creatorId?: string | null,
): Promise<void> {
  if (!creatorId) return;
  const access = await TaskService.getWriteAccess({ teamId }, creatorId);
  if (access === "forbidden") {
    throw new Error("Forbidden: Viewer role cannot create tasks");
  }
  if (access === "not_member") {
    throw new Error("Forbidden: Creator is not a member of this team");
  }
}

export async function assertProjectBelongsToTeam(
  teamId: string,
  projectId?: string | null,
): Promise<typeof project.$inferSelect | null> {
  if (!projectId) return null;
  const projectRecord = await db.query.project.findFirst({
    where: eq(project.id, projectId),
  });
  if (!projectRecord || projectRecord.teamId !== teamId) {
    throw new Error(
      `Project with id "${projectId}" not found in team "${teamId}"`,
    );
  }
  return projectRecord;
}

export async function assertAssigneeBelongsToTeam(
  teamId: string,
  assigneeId?: string | null,
): Promise<void> {
  if (!assigneeId) return;
  const isMember = await TeamService.isTeamMember(teamId, assigneeId);
  if (!isMember) {
    throw new Error(`User "${assigneeId}" is not a member of team "${teamId}"`);
  }
}
