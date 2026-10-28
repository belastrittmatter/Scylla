import { z } from "zod";
import type { Team, TeamMember } from "@/db/schema";

export const TeamRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);
export type TeamRole = z.infer<typeof TeamRoleSchema>;

export const ROLE_PRIORITY: Record<TeamRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
  viewer: 3,
};

export const CreateTeamSchema = z.object({
  name: z.string().min(1, "Team name cannot be empty").max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  ownerId: z.string().min(1, "Owner ID is required"),
});
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export const UpdateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});
export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;

export const AddTeamMemberSchema = z
  .object({
    teamId: z.string().min(1),
    userId: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: TeamRoleSchema.default("member"),
  })
  .refine((data) => Boolean(data.userId || data.email), {
    message: "Either userId or email is required",
  });
export type AddTeamMemberInput = z.infer<typeof AddTeamMemberSchema>;

export const UpdateMemberRoleSchema = z.object({
  role: TeamRoleSchema,
});
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;

export interface TeamMemberUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export type TeamMemberWithUser = TeamMember & {
  user?: TeamMemberUser | null;
};

export interface TeamWithMembers extends Team {
  members: (TeamMember & {
    user?: TeamMemberUser;
  })[];
}
