import { describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "../../src/db";
import { user } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";
import { ProjectService } from "../../src/services/project/project-service";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
} from "../../src/services/project/project-types";
import type { UpdateProjectInput } from "../../src/services/project/project-types";

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

  describe("githubRepo", () => {
    async function setup() {
      const [owner] = await db
        .insert(user)
        .values({
          id: crypto.randomUUID(),
          name: "Repo Test User",
          email: `repo-test-${crypto.randomUUID()}@example.com`,
        })
        .returning();
      const t = await TeamService.createTeam({
        name: `Repo Team ${crypto.randomUUID()}`,
        ownerId: owner.id,
      });
      return { owner, t };
    }

    test("stores githubRepo and returns it from reads and lists", async () => {
      const { owner, t } = await setup();
      try {
        const created = await ProjectService.createProject({
          name: "Linked",
          teamId: t.id,
          githubRepo: " acme/widgets ",
        });
        expect(created.githubRepo).toBe("acme/widgets");
        const byId = await ProjectService.getProjectById(created.id);
        expect(byId?.githubRepo).toBe("acme/widgets");
        const listed = await ProjectService.listProjectsByTeam(t.id);
        expect(listed[0].githubRepo).toBe("acme/widgets");
      } finally {
        await db.delete(user).where(inArray(user.id, [owner.id]));
      }
    });

    test("defaults githubRepo to null", async () => {
      const { owner, t } = await setup();
      try {
        const created = await ProjectService.createProject({
          name: "Unlinked",
          teamId: t.id,
        });
        expect(created.githubRepo).toBeNull();
      } finally {
        await db.delete(user).where(inArray(user.id, [owner.id]));
      }
    });

    test("rejects a malformed githubRepo", async () => {
      const { owner, t } = await setup();
      try {
        await expect(
          ProjectService.createProject({
            name: "Bad",
            teamId: t.id,
            githubRepo: "not a repo",
          }),
        ).rejects.toThrow("Repository must be in the form owner/repo");
      } finally {
        await db.delete(user).where(inArray(user.id, [owner.id]));
      }
    });

    test("updateProject never changes githubRepo", async () => {
      const { owner, t } = await setup();
      try {
        const created = await ProjectService.createProject({
          name: "Locked",
          teamId: t.id,
          githubRepo: "acme/widgets",
        });
        await ProjectService.updateProject(created.id, {
          name: "Locked 2",
          githubRepo: "evil/other",
        } as UpdateProjectInput);
        const after = await ProjectService.getProjectById(created.id);
        expect(after?.name).toBe("Locked 2");
        expect(after?.githubRepo).toBe("acme/widgets");
      } finally {
        await db.delete(user).where(inArray(user.id, [owner.id]));
      }
    });

    test("create schema trims, allows null, rejects URL form", () => {
      const base = { name: "n", teamId: "t" };
      expect(
        CreateProjectSchema.parse({ ...base, githubRepo: "  acme/widgets  " })
          .githubRepo,
      ).toBe("acme/widgets");
      expect(
        CreateProjectSchema.parse({ ...base, githubRepo: null }).githubRepo,
      ).toBeNull();
      expect(
        CreateProjectSchema.safeParse({
          ...base,
          githubRepo: "https://github.com/acme/widgets",
        }).success,
      ).toBe(false);
      expect(
        CreateProjectSchema.safeParse({ ...base, githubRepo: "" }).success,
      ).toBe(false);
    });

    test("update schema strips githubRepo", () => {
      const parsed = UpdateProjectSchema.parse({
        name: "x",
        githubRepo: "evil/other",
      });
      expect("githubRepo" in parsed).toBe(false);
    });

    test("slug, team-list and global-list reads return githubRepo", async () => {
      const { owner, t } = await setup();
      try {
        const created = await ProjectService.createProject({
          name: "Reads",
          teamId: t.id,
          githubRepo: "acme/widgets",
        });
        const bySlug = await ProjectService.getProjectBySlug(
          t.id,
          created.slug,
        );
        expect(bySlug?.githubRepo).toBe("acme/widgets");
        const many = await ProjectService.listProjectsByTeams([t.id]);
        expect(many.find((p) => p.id === created.id)?.githubRepo).toBe(
          "acme/widgets",
        );
        const all = await ProjectService.listProjects();
        expect(all.find((p) => p.id === created.id)?.githubRepo).toBe(
          "acme/widgets",
        );
      } finally {
        await db.delete(user).where(inArray(user.id, [owner.id]));
      }
    });
  });
});
