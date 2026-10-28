import { db } from "@/db";
import { project, team, type Project } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectFilterInput,
  type ProjectStatus,
} from "./project-types";

export class ProjectService {
  public static async createProject(input: CreateProjectInput): Promise<Project> {
    const validated = CreateProjectSchema.parse(input);
    const teamRecord = await db.query.team.findFirst({
      where: eq(team.id, validated.teamId),
    });
    if (!teamRecord) {
      throw new Error(`Team with id "${validated.teamId}" not found`);
    }

    const slug = validated.slug ? slugify(validated.slug) : slugify(validated.name);

    const [newProject] = await db
      .insert(project)
      .values({
        name: validated.name,
        slug,
        description: validated.description,
        teamId: validated.teamId,
        status: validated.status,
        color: validated.color,
      })
      .returning();

    return newProject;
  }

  public static async getProjectById(projectId: string): Promise<Project | null> {
    const record = await db.query.project.findFirst({
      where: eq(project.id, projectId),
    });
    return record ?? null;
  }

  public static async getProjectBySlug(teamId: string, slug: string): Promise<Project | null> {
    const record = await db.query.project.findFirst({
      where: and(eq(project.teamId, teamId), eq(project.slug, slug)),
    });
    return record ?? null;
  }

  public static async listProjectsByTeam(
    teamId: string,
    filter?: ProjectFilterInput
  ): Promise<(Project & { teamName?: string | null })[]> {
    const conditions = [eq(project.teamId, teamId)];

    if (filter?.status) {
      conditions.push(eq(project.status, filter.status));
    }

    const rows = await db
      .select({
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        teamId: project.teamId,
        status: project.status,
        color: project.color,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        teamName: team.name,
      })
      .from(project)
      .leftJoin(team, eq(project.teamId, team.id))
      .where(and(...conditions));

    return rows;
  }

  public static async listProjectsByTeams(
    teamIds: string[],
    filter?: ProjectFilterInput
  ): Promise<(Project & { teamName?: string | null })[]> {
    if (!teamIds || teamIds.length === 0) {
      return [];
    }

    const conditions = [inArray(project.teamId, teamIds)];

    if (filter?.status) {
      conditions.push(eq(project.status, filter.status));
    }

    const rows = await db
      .select({
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        teamId: project.teamId,
        status: project.status,
        color: project.color,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        teamName: team.name,
      })
      .from(project)
      .leftJoin(team, eq(project.teamId, team.id))
      .where(and(...conditions));

    return rows;
  }

  public static async listProjects(
    filter?: ProjectFilterInput
  ): Promise<(Project & { teamName?: string | null })[]> {
    const query = db
      .select({
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        teamId: project.teamId,
        status: project.status,
        color: project.color,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        teamName: team.name,
      })
      .from(project)
      .leftJoin(team, eq(project.teamId, team.id));

    if (filter?.status) {
      return await query.where(eq(project.status, filter.status));
    }
    return await query;
  }

  public static async updateProjectStatus(
    projectId: string,
    status: ProjectStatus
  ): Promise<Project> {
    return this.updateProject(projectId, { status });
  }

  public static async updateProject(
    projectId: string,
    input: UpdateProjectInput
  ): Promise<Project> {
    const validated = UpdateProjectSchema.parse(input);

    const updateData: Partial<typeof project.$inferInsert> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = slugify(validated.slug);
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.color !== undefined) updateData.color = validated.color;

    const [updated] = await db
      .update(project)
      .set(updateData)
      .where(eq(project.id, projectId))
      .returning();

    if (!updated) {
      throw new Error(`Project with id "${projectId}" not found`);
    }

    return updated;
  }

  public static async deleteProject(projectId: string): Promise<boolean> {
    const deleted = await db.delete(project).where(eq(project.id, projectId)).returning();

    return deleted.length > 0;
  }
}
