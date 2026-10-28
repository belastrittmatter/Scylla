import { describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "../../src/db";
import { user } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";
import { ProjectService } from "../../src/services/project/project-service";

describe("ProjectService Domain Logic", () => {
  test("creates, updates status, and filters projects", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Project Test User",
        email: `project-test-${Date.now()}@example.com`,
      })
      .returning();

    const newTeam = await TeamService.createTeam({
      name: `Project Team ${Date.now()}`,
      ownerId: testOwner.id,
    });

    // Create project
    const newProject = await ProjectService.createProject({
      name: "API Gateway Protocol",
      description: "Gateway router implementation",
      teamId: newTeam.id,
      color: "#3b82f6",
    });

    expect(newProject.id).toBeDefined();
    expect(newProject.teamId).toBe(newTeam.id);
    expect(newProject.status).toBe("active");
    expect(newProject.slug).toBe("api-gateway-protocol");

    // Fetch by ID & slug
    const byId = await ProjectService.getProjectById(newProject.id);
    expect(byId?.id).toBe(newProject.id);

    const bySlug = await ProjectService.getProjectBySlug(newTeam.id, "api-gateway-protocol");
    expect(bySlug?.id).toBe(newProject.id);

    // Update status
    const updated = await ProjectService.updateProjectStatus(newProject.id, "completed");
    expect(updated.status).toBe("completed");

    // Filter by status
    const activeProjects = await ProjectService.listProjectsByTeam(newTeam.id, {
      status: "active",
    });
    expect(activeProjects.length).toBe(0);

    const completedProjects = await ProjectService.listProjectsByTeam(newTeam.id, {
      status: "completed",
    });
    expect(completedProjects.length).toBe(1);

    // Delete project
    const deleted = await ProjectService.deleteProject(newProject.id);
    expect(deleted).toBe(true);

    // Clean up
    await db.delete(user).where(inArray(user.id, [testOwner.id]));
  });

  test("fails to create project with non-existent teamId", async () => {
    await expect(
      ProjectService.createProject({
        name: "Orphan Project",
        teamId: "non-existent-team-id",
      })
    ).rejects.toThrow('Team with id "non-existent-team-id" not found');
  });
});
