import { describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "../../src/db";
import { user } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";
import { ProjectService } from "../../src/services/project/project-service";
import { UpdateProjectSchema } from "../../src/services/project/project-types";
import type { UpdateProjectInput } from "../../src/services/project/project-types";
import { GITHUB_REPO_FORMAT_ERROR } from "../../src/lib/github-validation";

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

    const bySlug = await ProjectService.getProjectBySlug(
      newTeam.id,
      "api-gateway-protocol",
    );
    expect(bySlug?.id).toBe(newProject.id);

    // Update status
    const updated = await ProjectService.updateProjectStatus(
      newProject.id,
      "completed",
    );
    expect(updated.status).toBe("completed");

    // Filter by status
    const activeProjects = await ProjectService.listProjectsByTeam(newTeam.id, {
      status: "active",
    });
    expect(activeProjects.length).toBe(0);

    const completedProjects = await ProjectService.listProjectsByTeam(
      newTeam.id,
      {
        status: "completed",
      },
    );
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
      }),
    ).rejects.toThrow('Team with id "non-existent-team-id" not found');
  });

  test("stores, lists and protects the linked GitHub repository", async () => {
    const [owner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Repo Test User",
        email: `repo-test-${crypto.randomUUID()}@example.com`,
      })
      .returning();
    try {
      const team = await TeamService.createTeam({
        name: `Repo Team ${Date.now()}`,
        ownerId: owner.id,
      });

      const linked = await ProjectService.createProject({
        name: "Linked",
        teamId: team.id,
        githubRepo: " octo/repo ",
      });
      expect(linked.githubRepo).toBe("octo/repo");

      const plain = await ProjectService.createProject({
        name: "Plain",
        teamId: team.id,
      });
      expect(plain.githubRepo).toBeNull();

      const rejection = await ProjectService.createProject({
        name: "Bad",
        teamId: team.id,
        githubRepo: "not a repo",
      }).catch((e: unknown) => e);
      expect(rejection).toBeInstanceOf(ZodError);
      expect((rejection as ZodError).issues[0].message).toBe(
        GITHUB_REPO_FORMAT_ERROR,
      );

      const listed = await ProjectService.listProjectsByTeam(team.id);
      expect(listed.find((p) => p.id === linked.id)?.githubRepo).toBe(
        "octo/repo",
      );
      const byId = await ProjectService.getProjectById(linked.id);
      expect(byId?.githubRepo).toBe("octo/repo");

      const renamed = await ProjectService.updateProject(linked.id, {
        name: "Renamed",
        githubRepo: "other/repo",
      } as UpdateProjectInput);
      expect(renamed.name).toBe("Renamed");
      expect(renamed.githubRepo).toBe("octo/repo");
    } finally {
      await db.delete(user).where(inArray(user.id, [owner.id]));
    }
  });

  test("returns githubRepo from every read path and rejects blank or null-safe input", async () => {
    const [owner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Repo Read User",
        email: `repo-read-${crypto.randomUUID()}@example.com`,
      })
      .returning();
    try {
      const team = await TeamService.createTeam({
        name: `Repo Read Team ${Date.now()}`,
        ownerId: owner.id,
      });
      const linked = await ProjectService.createProject({
        name: "Linked read",
        slug: `linked-read-${Date.now()}`,
        teamId: team.id,
        githubRepo: "octo/read",
      });
      const nulled = await ProjectService.createProject({
        name: "Null link",
        teamId: team.id,
        githubRepo: null,
      });
      expect(nulled.githubRepo).toBeNull();

      const bySlug = await ProjectService.getProjectBySlug(
        team.id,
        linked.slug,
      );
      expect(bySlug?.githubRepo).toBe("octo/read");
      const byTeams = await ProjectService.listProjectsByTeams([team.id]);
      expect(byTeams.find((p) => p.id === linked.id)?.githubRepo).toBe(
        "octo/read",
      );
      const all = await ProjectService.listProjects();
      expect(all.find((p) => p.id === linked.id)?.githubRepo).toBe("octo/read");

      for (const bad of ["", "   ", "https://github.com/a/b", "a/b/c"]) {
        const err = await ProjectService.createProject({
          name: "Bad",
          teamId: team.id,
          githubRepo: bad,
        }).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(ZodError);
        expect((err as ZodError).issues[0].message).toBe(
          GITHUB_REPO_FORMAT_ERROR,
        );
      }
      expect(
        UpdateProjectSchema.parse({ name: "x", githubRepo: "a/b" }),
      ).not.toHaveProperty("githubRepo");
    } finally {
      await db.delete(user).where(inArray(user.id, [owner.id]));
    }
  });
});
