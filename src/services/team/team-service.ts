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
  hasTeamRole,
  type TeamRole,
  type TeamWithMembers,
  type TeamMemberWithUser,
} from "./team-types";
import {
  teamWithMembersQuery,
  memberWithUserQuery,
  sortTeamMembersByRole,
} from "./team-helpers";

export class TeamPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TeamPermissionError";
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Locks the team row (serialising member changes per team), then applies the one
 * member-management rule set shared by REST and MCP. `change` is the new role or "remove".
 */
async function lockAndAuthorizeMemberChange(
  tx: Tx,
  teamId: string,
  actorId: string,
  targetUserId: string,
  change: TeamRole | "remove",
): Promise<{ targetRole: TeamRole | null }> {
  const [teamRow] = await tx
    .select({ ownerId: team.ownerId })
    .from(team)
    .where(eq(team.id, teamId))
    .for("update");
  if (!teamRow) throw new Error(`Team with id "${teamId}" not found`);

  const rows = await tx
    .select({ userId: teamMember.userId, role: teamMember.role })
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, teamId),
        inArray(teamMember.userId, [actorId, targetUserId]),
      ),
    );
  const roleOf = (id: string) =>
    (rows.find((r) => r.userId === id)?.role as TeamRole | undefined) ?? null;
  const actorRole: TeamRole | null =
    teamRow.ownerId === actorId ? "owner" : roleOf(actorId);
  const targetRole = roleOf(targetUserId);
  const isSelf = actorId === targetUserId;

  if (targetUserId === teamRow.ownerId) {
    throw new TeamPermissionError(
      change === "remove"
        ? "Cannot remove the owner of the team"
        : "Permission denied: the team owner's role cannot be changed",
    );
  }
  if (change === "remove" && isSelf) return { targetRole };
  if (!hasTeamRole(actorRole, "admin")) {
    throw new TeamPermissionError(
      "Permission denied: Team owner or admin role required",
    );
  }
  if (change === "owner" && actorRole !== "owner") {
    throw new TeamPermissionError(
      "Permission denied: Only team owners can assign the owner role",
    );
  }
  if (hasTeamRole(targetRole, "admin") && actorRole !== "owner" && !isSelf) {
    throw new TeamPermissionError(
      "Permission denied: Admins cannot modify owners or other admins",
    );
  }
  return { targetRole };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class TeamService {
  public static async createTeam(input: CreateTeamInput): Promise<Team> {
    const validated = CreateTeamSchema.parse(input);
    const slug = validated.slug
      ? slugify(validated.slug)
      : slugify(validated.name);

    if (UUID_REGEX.test(slug)) {
      throw new Error("Team slug cannot be formatted as a UUID");
    }

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

  /**
   * Canonical team id for an id or slug. An exact id always wins, so a team
   * whose slug equals another team's id can never stand in for it.
   */
  public static async resolveTeamId(
    teamIdOrSlug: string,
  ): Promise<string | null> {
    const byId = await db.query.team.findFirst({
      where: eq(team.id, teamIdOrSlug),
      columns: { id: true },
    });
    if (byId) return byId.id;
    const bySlug = await db.query.team.findFirst({
      where: eq(team.slug, teamIdOrSlug),
      columns: { id: true },
    });
    return bySlug?.id ?? null;
  }

  /** Matches by team id only; resolve slugs with resolveTeamId first. */
  public static async getUserRole(
    teamId: string,
    userId: string,
  ): Promise<TeamRole | null> {
    const teamRecord = await db.query.team.findFirst({
      where: eq(team.id, teamId),
      columns: { id: true, ownerId: true },
    });
    if (!teamRecord) return null;
    if (teamRecord.ownerId === userId) return "owner";

    const membership = await db.query.teamMember.findFirst({
      where: and(
        eq(teamMember.teamId, teamRecord.id),
        eq(teamMember.userId, userId),
      ),
      columns: { role: true },
    });

    return (membership?.role as TeamRole) ?? null;
  }

  /** Matches by team id only; resolve slugs with resolveTeamId first. */
  public static async isTeamAdminOrOwner(
    teamId: string,
    userId: string,
  ): Promise<boolean> {
    const role = await TeamService.getUserRole(teamId, userId);
    return role === "owner" || role === "admin";
  }

  /** Matches by team id only; resolve slugs with resolveTeamId first. */
  public static async isTeamMember(
    teamId: string,
    userId: string,
  ): Promise<boolean> {
    const role = await TeamService.getUserRole(teamId, userId);
    return role !== null;
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
      const foundUser = await db.query.user.findFirst({
        where: eq(user.email, emailLower),
      });
      if (!foundUser) {
        throw new Error(`User with email "${validated.email}" not found`);
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

  /** Removes `userId` if `actorId` may (self-leave, or admin+ over lower roles). */
  public static async removeTeamMember(
    teamId: string,
    userId: string,
    actorId: string,
  ): Promise<boolean> {
    return db.transaction(async (tx) => {
      const { targetRole } = await lockAndAuthorizeMemberChange(
        tx,
        teamId,
        actorId,
        userId,
        "remove",
      );
      if (!targetRole) return false;
      const deleted = await tx
        .delete(teamMember)
        .where(
          and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
        )
        .returning();
      return deleted.length > 0;
    });
  }

  /** Changes `userId`'s role if `actorId` may; check and write share one locked transaction. */
  public static async updateMemberRole(
    teamId: string,
    userId: string,
    role: TeamRole,
    actorId: string,
  ): Promise<TeamMember> {
    const validated = UpdateMemberRoleSchema.parse({ role });
    return db.transaction(async (tx) => {
      const { targetRole } = await lockAndAuthorizeMemberChange(
        tx,
        teamId,
        actorId,
        userId,
        validated.role,
      );
      if (!targetRole) throw new Error("Team member not found");
      const [updated] = await tx
        .update(teamMember)
        .set({ role: validated.role })
        .where(
          and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
        )
        .returning();
      return updated;
    });
  }

  public static async updateTeam(
    teamId: string,
    input: UpdateTeamInput,
  ): Promise<Team> {
    const validated = UpdateTeamSchema.parse(input);
    const updateData: Partial<typeof team.$inferInsert> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) {
      const slugified = slugify(validated.slug);
      if (UUID_REGEX.test(slugified)) {
        throw new Error("Team slug cannot be formatted as a UUID");
      }
      updateData.slug = slugified;
    }
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
