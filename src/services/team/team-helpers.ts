import { ROLE_PRIORITY, type TeamRole } from "./team-types";

export const teamWithMembersQuery = {
  with: {
    members: {
      with: {
        user: { columns: { id: true, name: true, email: true, image: true } },
      },
    },
  },
} as const;

export const memberWithUserQuery = {
  with: {
    user: { columns: { id: true, name: true, email: true, image: true } },
  },
} as const;

export function sortTeamMembersByRole<T extends { role: string }>(members: T[]): T[] {
  return members.sort(
    (a, b) => (ROLE_PRIORITY[a.role as TeamRole] ?? 99) - (ROLE_PRIORITY[b.role as TeamRole] ?? 99)
  );
}
