import { db } from "@/db";
import {
  user,
  team,
  teamMember,
  type Team,
  type TeamMember,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import {
  CreateTeamSchema,
  UpdateTeamSchema,
  AddTeamMemberSchema,
  UpdateMemberRoleSchema,
  type CreateTeamInput,
  type UpdateTeamInput,
  type AddTeamMemberInput,
  type TeamRole,
  type TeamWithMembers,
  type TeamMemberWithUser,
} from "./team-types";
import {
  teamWithMembersQuery,
  memberWithUserQuery,
  sortTeamMembersByRole,
} from "./team-helpers";

export class TeamService {
  public static async createTeam(input: CreateTeamInput): Promise<Team> {
    const validated = CreateTeamSchema.parse(input);
    const slug = validated.slug
      ? slugify(validated.slug)
      : slugify(validated.name);

    return await db.transaction(async (tx) => {
      const [newTeam] = await tx
        .insert(team)
        .values({
          name: validated.name,
          slug,
          description: validated.description,
          ownerId: validated.ownerId,
        })
        .returning();

      await tx.insert(teamMember).values({
        teamId: newTeam.id,
        userId: validated.ownerId,
        role: "owner",
      });

      return newTeam;
    });
  }

  public static async getTeamById(
    teamId: string,
  ): Promise<TeamWithMembers | null> {
    const record = await db.query.team.findFirst({
      where: eq(team.id, teamId),
      ...teamWithMembersQuery,
    });
    if (!record) return null;
    if (Array.isArray(record.members)) {
      sortTeamMembersByRole(record.members);
    }
    return record as TeamWithMembers;
  }

  public static async getTeamBySlug(
    slug: string,
  ): Promise<TeamWithMembers | null> {
    const record = await db.query.team.findFirst({
      where: eq(team.slug, slug),
      ...teamWithMembersQuery,
    });
    if (!record) return null;
    if (Array.isArray(record.members)) {
      sortTeamMembersByRole(record.members);
    }
    return record as TeamWithMembers;
  }

  public static async listUserTeams(userId: string): Promise<Team[]> {
    const memberships = await db
      .select({ teamId: teamMember.teamId })
      .from(teamMember)
      .where(eq(teamMember.userId, userId));

    if (memberships.length === 0) return [];
    return await db
      .select()
      .from(team)
      .where(
        inArray(
          team.id,
          memberships.map((m) => m.teamId),
        ),
      );
  }

  public static async addTeamMember(
    input: AddTeamMemberInput,
  ): Promise<TeamMemberWithUser> {
    const validated = AddTeamMemberSchema.parse(input);
    let targetUserId = validated.userId;

    if (!targetUserId && validated.email) {
      const emailLower = validated.email.toLowerCase();
      let foundUser = await db.query.user.findFirst({
        where: eq(user.email, emailLower),
      });
      if (!foundUser) {
        const [newUser] = await db
          .insert(user)
          .values({
            id: crypto.randomUUID(),
            name: emailLower.split("@")[0],
            email: emailLower,
          })
          .returning();
        foundUser = newUser;
      }
      targetUserId = foundUser.id;
    }

    if (!targetUserId) {
      throw new Error("Either userId or email is required");
    }

    const [member] = await db
      .insert(teamMember)
      .values({
        teamId: validated.teamId,
        userId: targetUserId,
        role: validated.role,
      })
      .returning();

    const memberWithUser = await db.query.teamMember.findFirst({
      where: eq(teamMember.id, member.id),
      ...memberWithUserQuery,
    });

    return (memberWithUser ?? member) as TeamMemberWithUser;
  }

  public static async removeTeamMember(
    teamId: string,
    userId: string,
  ): Promise<boolean> {
    const targetTeam = await db.query.team.findFirst({
      where: eq(team.id, teamId),
    });
    if (targetTeam?.ownerId === userId) {
      throw new Error("Cannot remove the owner of the team");
    }

    const deleted = await db
      .delete(teamMember)
      .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
      .returning();

    return deleted.length > 0;
  }

  public static async updateMemberRole(
    teamId: string,
    userId: string,
    role: TeamRole,
  ): Promise<TeamMember> {
    const validated = UpdateMemberRoleSchema.parse({ role });
    const [updated] = await db
      .update(teamMember)
      .set({ role: validated.role })
      .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
      .returning();

    if (!updated) {
      throw new Error("Team member not found");
    }
    return updated;
  }

  public static async updateTeam(
    teamId: string,
    input: UpdateTeamInput,
  ): Promise<Team> {
    const validated = UpdateTeamSchema.parse(input);
    const updateData: Partial<typeof team.$inferInsert> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = slugify(validated.slug);
    if (validated.description !== undefined)
      updateData.description = validated.description;

    const [updated] = await db
      .update(team)
      .set(updateData)
      .where(eq(team.id, teamId))
      .returning();
    if (!updated) {
      throw new Error(`Team with id "${teamId}" not found`);
    }
    return updated;
  }

  public static async deleteTeam(teamId: string): Promise<boolean> {
    const deleted = await db
      .delete(team)
      .where(eq(team.id, teamId))
      .returning();
    return deleted.length > 0;
  }

  public static async listTeamMembers(
    teamId: string,
  ): Promise<TeamMemberWithUser[]> {
    const members = (await db.query.teamMember.findMany({
      where: eq(teamMember.teamId, teamId),
      ...memberWithUserQuery,
    })) as TeamMemberWithUser[];

    return sortTeamMembersByRole(members);
  }
}
