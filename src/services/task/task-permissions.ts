// Pure and dependency-free so the client can mirror the server rule.

export type TaskWriteContext = {
  /** Caller's team role; null/undefined when not a member. */
  role?: string | null;
  /** Caller is `team.ownerId` (owners may lack a member row). */
  isTeamOwner: boolean;
};

/** Team owner/owner/admin/member create, update and delete any task in the team; viewers are read-only. */
export function canMutateTasks({
  role,
  isTeamOwner,
}: TaskWriteContext): boolean {
  return (
    isTeamOwner || role === "owner" || role === "admin" || role === "member"
  );
}

export const canDeleteTask = canMutateTasks;
