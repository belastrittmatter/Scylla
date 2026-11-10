import { describe, expect, test } from "bun:test";
import {
  findTeamBySlugOrId,
  findProjectBySlugOrId,
  buildTasksUrl,
  deriveTaskWorkspaceRoute,
} from "../../src/components/tasks/use-task-workspace-routing";
import {
  parseTaskViewMode,
  resolveTaskViewMode,
} from "../../src/components/tasks/task-view-mode";
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
      githubRepo: null,
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
      githubRepo: null,
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

  describe("buildTasksUrl", () => {
    test("me scope is the bare /tasks route", () => {
      expect(buildTasksUrl({ scope: "me", team: "x" })).toBe("/tasks");
    });

    test("team scope carries team and optional project", () => {
      expect(buildTasksUrl({ scope: "team", team: "engineering-core" })).toBe(
        "/tasks?scope=team&team=engineering-core",
      );
      expect(
        buildTasksUrl({
          scope: "team",
          team: "engineering-core",
          project: "mobile-app",
        }),
      ).toBe("/tasks?scope=team&team=engineering-core&project=mobile-app");
    });
  });

  describe("view param", () => {
    test("buildTasksUrl keeps the view for every scope", () => {
      expect(buildTasksUrl({ scope: "me", view: "board" })).toBe(
        "/tasks?view=board",
      );
      expect(
        buildTasksUrl({
          scope: "team",
          team: "engineering-core",
          project: "mobile-app",
          view: "timeline",
        }),
      ).toBe(
        "/tasks?scope=team&team=engineering-core&project=mobile-app&view=timeline",
      );
      expect(buildTasksUrl({ scope: "me", view: null })).toBe("/tasks");
    });

    test("deriveTaskWorkspaceRoute reads a valid view and ignores junk", () => {
      const derive = (query: string) =>
        deriveTaskWorkspaceRoute({
          pathname: "/tasks",
          searchParams: new URLSearchParams(query),
          teams: mockTeams,
          projects: mockProjects,
        }).view;
      expect(derive("view=board")).toBe("board");
      expect(derive("scope=team&team=product-design&view=timeline")).toBe(
        "timeline",
      );
      expect(derive("scope=team&view=list")).toBe("list");
      expect(derive("view=gantt")).toBeUndefined();
      expect(derive("")).toBeUndefined();
    });

    test("resolveTaskViewMode: URL, then stored choice, then scope default", () => {
      expect(resolveTaskViewMode("team", undefined, undefined)).toBe("board");
      expect(resolveTaskViewMode("me", undefined, undefined)).toBe("list");
      expect(resolveTaskViewMode("team", undefined, "list")).toBe("list");
      expect(resolveTaskViewMode("me", "timeline", "list")).toBe("timeline");
    });

    test("parseTaskViewMode accepts only known modes", () => {
      expect(parseTaskViewMode("list")).toBe("list");
      expect(parseTaskViewMode("Board")).toBeUndefined();
      expect(parseTaskViewMode(null)).toBeUndefined();
    });
  });

  describe("deriveTaskWorkspaceRoute", () => {
    const derive = (pathname: string, query = "") =>
      deriveTaskWorkspaceRoute({
        pathname,
        searchParams: new URLSearchParams(query),
        teams: mockTeams,
        projects: mockProjects,
      });
    const ids = (r: ReturnType<typeof derive>) => [
      r.scope,
      r.team?.id ?? null,
      r.project?.id ?? null,
    ];

    test("/tasks resolves to me with no team selection", () => {
      expect(ids(derive("/tasks"))).toEqual(["me", null, null]);
    });

    test("scope=team with team and project slugs", () => {
      expect(
        ids(
          derive(
            "/tasks",
            "scope=team&team=engineering-core&project=mobile-app",
          ),
        ),
      ).toEqual(["team", "team-eng-1", "proj-mobile-2"]);
    });

    test("scope=team without project means all projects of the team", () => {
      expect(ids(derive("/tasks", "scope=team&team=product-design"))).toEqual([
        "team",
        "team-design-2",
        null,
      ]);
    });

    test("scope=team without a valid team falls back to the first team", () => {
      expect(ids(derive("/tasks", "scope=team&team=nope"))).toEqual([
        "team",
        "team-eng-1",
        null,
      ]);
    });

    test("removed scope=all resolves to me and keeps the view", () => {
      expect(ids(derive("/tasks", "scope=all"))).toEqual(["me", null, null]);
      expect(
        ids(derive("/tasks", "scope=all&team=product-design&view=board")),
      ).toEqual(["me", null, null]);
      expect(derive("/tasks", "scope=all&view=board").view).toBe("board");
    });

    test("legacy /tasks/<team>/<project> path resolves to team scope", () => {
      expect(ids(derive("/tasks/engineering-core/mobile-app"))).toEqual([
        "team",
        "team-eng-1",
        "proj-mobile-2",
      ]);
      expect(ids(derive("/tasks/engineering-core"))).toEqual([
        "team",
        "team-eng-1",
        null,
      ]);
    });

    test("legacy ?teamId=&projectId= query resolves to team scope", () => {
      expect(
        ids(derive("/tasks", "teamId=team-eng-1&projectId=proj-bridge-1")),
      ).toEqual(["team", "team-eng-1", "proj-bridge-1"]);
    });

    test("unknown scope value falls back to me", () => {
      expect(ids(derive("/tasks", "scope=bogus"))).toEqual(["me", null, null]);
    });

    test("a project from another team is ignored", () => {
      expect(
        ids(
          derive("/tasks", "scope=team&team=product-design&project=mobile-app"),
        ),
      ).toEqual(["team", "team-design-2", null]);
    });
  });
});
