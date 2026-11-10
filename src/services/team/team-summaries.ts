import type { TeamRole } from "./team-types";

/** Role of `userId` in `team`; the owner column wins over the member row. */
export function roleInTeam(
  team: { ownerId: string; members: { userId: string; role: string }[] },
  userId: string,
): TeamRole | undefined {
  if (team.ownerId === userId) return "owner";
  return team.members.find((m) => m.userId === userId)?.role as
    TeamRole | undefined;
}
