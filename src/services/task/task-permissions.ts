// Pure and dependency-free so the client can mirror the server rule.

export type TaskDeleteContext = {
  /** Caller's team role; null/undefined when not a member. */
  role?: string | null;
  /** Caller is `team.ownerId` (owners may lack a member row). */
  isTeamOwner: boolean;
};

/** Team owner/owner/admin/member delete any task in the team; viewers never. */
export function canDeleteTask({
  role,
  isTeamOwner,
}: TaskDeleteContext): boolean {
  return (
    isTeamOwner || role === "owner" || role === "admin" || role === "member"
  );
}
