import { describe, expect, test } from "bun:test";
import {
  findTeamBySlugOrId,
  findProjectBySlugOrId,
  buildTaskWorkspaceUrl,
} from "../../src/components/tasks/use-task-workspace-routing";
import type { Team, Project } from "../../src/components/tasks/task-types";

describe("Task Workspace Slug Routing Utilities", () => {
  const mockTeams: Team[] = [
    {
      id: "team-eng-1",
      name: "Engineering Core",
      slug: "engineering-core",
      description: "Platform core",
      ownerId: "usr-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "team-design-2",
      name: "Product Design",
      slug: "product-design",
      description: "UI & UX",
      ownerId: "usr-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockProjects: Project[] = [
    {
      id: "proj-bridge-1",
      teamId: "team-eng-1",
      name: "MCP Client Bridge",
      slug: "mcp-client-bridge",
      description: "Protocol client",
      status: "active",
      color: "#3b82f6",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "proj-mobile-2",
      teamId: "team-eng-1",
      name: "Mobile App",
      slug: "mobile-app",
      description: "Mobile frontend",
      status: "planning",
      color: "#10b981",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe("findTeamBySlugOrId", () => {
    test("resolves team by slug matching exactly", () => {
      const team = findTeamBySlugOrId(mockTeams, "engineering-core");
      expect(team?.id).toBe("team-eng-1");
    });

    test("resolves team by slug case-insensitively", () => {
      const team = findTeamBySlugOrId(mockTeams, "ENGINEERING-CORE");
      expect(team?.id).toBe("team-eng-1");
    });

    test("resolves team by internal ID", () => {
      const team = findTeamBySlugOrId(mockTeams, "team-design-2");
      expect(team?.slug).toBe("product-design");
    });

    test("returns undefined for non-existent team or empty input", () => {
      expect(findTeamBySlugOrId(mockTeams, "non-existent")).toBeUndefined();
      expect(findTeamBySlugOrId(mockTeams, undefined)).toBeUndefined();
      expect(findTeamBySlugOrId(mockTeams, null)).toBeUndefined();
      expect(findTeamBySlugOrId(mockTeams, "")).toBeUndefined();
    });
  });

  describe("findProjectBySlugOrId", () => {
    test("resolves project by slug matching exactly", () => {
      const proj = findProjectBySlugOrId(mockProjects, "mcp-client-bridge");
      expect(proj?.id).toBe("proj-bridge-1");
    });

    test("resolves project by slug case-insensitively", () => {
      const proj = findProjectBySlugOrId(mockProjects, "MCP-CLIENT-BRIDGE");
      expect(proj?.id).toBe("proj-bridge-1");
    });

    test("resolves project by internal ID", () => {
      const proj = findProjectBySlugOrId(mockProjects, "proj-mobile-2");
      expect(proj?.slug).toBe("mobile-app");
    });

    test("returns undefined when identifier is 'all' or empty", () => {
      expect(findProjectBySlugOrId(mockProjects, "all")).toBeUndefined();
      expect(findProjectBySlugOrId(mockProjects, undefined)).toBeUndefined();
      expect(findProjectBySlugOrId(mockProjects, "")).toBeUndefined();
      expect(
        findProjectBySlugOrId(mockProjects, "unknown-slug"),
      ).toBeUndefined();
    });
  });

  describe("buildTaskWorkspaceUrl", () => {
    test("builds team-level task URL when project is not specified", () => {
      expect(buildTaskWorkspaceUrl("engineering-core")).toBe(
        "/tasks/engineering-core",
      );
    });

    test("builds team-level task URL when project is 'all'", () => {
      expect(buildTaskWorkspaceUrl("engineering-core", "all")).toBe(
        "/tasks/engineering-core",
      );
    });

    test("builds scoped project task URL when project slug is provided", () => {
      expect(buildTaskWorkspaceUrl("engineering-core", "mobile-app")).toBe(
        "/tasks/engineering-core/mobile-app",
      );
    });
  });
});
