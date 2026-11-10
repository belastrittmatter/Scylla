import { TeamRoleSchema, type TeamRole } from "@/services/team/team-types";

/** Roles an admin can hand out; ownership is fixed to the team owner. */
export const ASSIGNABLE_ROLES: TeamRole[] = TeamRoleSchema.options.filter(
  (r) => r !== "owner",
);

export const canManageTeam = (role?: TeamRole) =>
  role === "owner" || role === "admin";
