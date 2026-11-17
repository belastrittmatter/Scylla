import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { team, teamMember, type Task } from "@/db/schema";
import { canMutateTasks } from "./task-permissions";

/** `not_member` must be reported like a missing task so ids can't be probed. */
export type TaskWriteAccess = "allowed" | "forbidden" | "not_member";

/** Thrown by task mutations; `not_member` reads as "not found" so ids can't be probed. */
export class TaskAccessError extends Error {
  constructor(
    readonly access: Exclude<TaskWriteAccess, "allowed">,
    message: string,
  ) {
    super(message);
    this.name = "TaskAccessError";
  }
}

/** Single write-permission check for create/update/delete (see task-permissions). */
export async function getWriteAccess(
  target: Pick<Task, "teamId">,
  userId: string,
): Promise<TaskWriteAccess> {
  const [teamRecord, membership] = await Promise.all([
    db.query.team.findFirst({
      where: eq(team.id, target.teamId),
      columns: { ownerId: true },
    }),
    db.query.teamMember.findFirst({
      where: and(
        eq(teamMember.teamId, target.teamId),
        eq(teamMember.userId, userId),
      ),
      columns: { role: true },
    }),
  ]);
  const isTeamOwner = teamRecord?.ownerId === userId;
  if (!isTeamOwner && !membership) return "not_member";
  const allowed = canMutateTasks({ role: membership?.role, isTeamOwner });
  return allowed ? "allowed" : "forbidden";
}

/** Throws TaskAccessError unless `userId` may mutate tasks of `target`'s team. */
export async function assertWriteAccess(
  target: Pick<Task, "id" | "teamId">,
  userId: string,
  forbiddenMessage: string,
): Promise<void> {
  const access = await getWriteAccess(target, userId);
  if (access === "not_member") {
    throw new TaskAccessError(access, `Task with id "${target.id}" not found`);
  }
  if (access === "forbidden") {
    throw new TaskAccessError(access, forbiddenMessage);
  }
}
