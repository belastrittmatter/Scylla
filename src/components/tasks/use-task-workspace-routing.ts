"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { TaskScope } from "./task-selectors";
import type { TaskViewMode } from "./task-scope-content";
import {
  parseTaskViewMode,
  readStoredView,
  resolveTaskViewMode,
  storeView,
} from "./task-view-mode";
import type { Team, Project } from "./task-types";

export function findTeamBySlugOrId(
  teams: Team[],
  identifier?: string | null,
): Team | undefined {
  if (!identifier) return undefined;
  const lower = identifier.toLowerCase();
  return teams.find(
    (t) => t.slug.toLowerCase() === lower || t.id === identifier,
  );
}

export function findProjectBySlugOrId(
  projects: Project[],
  identifier?: string | null,
): Project | undefined {
  if (!identifier || identifier === "all") return undefined;
  const lower = identifier.toLowerCase();
  return projects.find(
    (p) => p.slug.toLowerCase() === lower || p.id === identifier,
  );
}

export interface TasksUrlParts {
  scope: TaskScope;
  team?: string | null;
  project?: string | null;
  view?: TaskViewMode | null;
}

/** Canonical /tasks URL for a scope; team/project are slugs. */
export function buildTasksUrl({
  scope,
  team,
  project,
  view,
}: TasksUrlParts): string {
  const params = new URLSearchParams();
  if (scope !== "me") {
    params.set("scope", scope);
    if (team) params.set("team", team);
    if (project) params.set("project", project);
  }
  if (view) params.set("view", view);
  const query = params.toString();
  return query ? `/tasks?${query}` : "/tasks";
}

export interface TaskWorkspaceRoute {
  scope: TaskScope;
  team?: Team;
  project?: Project;
  /** Only set when the URL names a valid view. */
  view?: TaskViewMode;
}

/**
 * Single source of truth for scope/team/project, derived from the URL.
 * Legacy `/tasks/<team>/<project>` and `?teamId=&projectId=` resolve to Team.
 */
export function deriveTaskWorkspaceRoute({
  pathname,
  searchParams,
  teams,
  projects,
}: {
  pathname: string;
  searchParams: Pick<URLSearchParams, "get">;
  teams: Team[];
  projects: Project[];
}): TaskWorkspaceRoute {
  const [pathTeam, pathProject] = pathname
    .replace(/^\/tasks\/?/, "")
    .split("/")
    .filter(Boolean);
  const teamRef =
    pathTeam ?? searchParams.get("team") ?? searchParams.get("teamId");
  const projectRef =
    pathProject ?? searchParams.get("project") ?? searchParams.get("projectId");
  const rawScope = searchParams.get("scope");
  const view = parseTaskViewMode(searchParams.get("view"));

  // Unknown or removed scopes (e.g. the old `all`) resolve to Me.
  const scope: TaskScope =
    pathTeam || (rawScope ?? (teamRef || projectRef ? "team" : "me")) === "team"
      ? "team"
      : "me";
  if (scope === "me") return { scope, view };

  let team = findTeamBySlugOrId(teams, teamRef);
  let project = findProjectBySlugOrId(
    team ? projects.filter((p) => p.teamId === team?.id) : projects,
    projectRef,
  );
  if (!team && project) team = teams.find((t) => t.id === project?.teamId);
  // Team scope is never empty: fall back to the first team, all projects.
  if (scope === "team" && !team) {
    team = teams[0];
    project = undefined;
  }
  return { scope, team, project, view };
}

export interface TaskWorkspaceNavigation {
  scope: TaskScope;
  team?: Team | null;
  /** The project's team is used when `team` is omitted. */
  project?: Project | null;
}

export function useTaskWorkspaceRouting({
  teams,
  projects,
}: {
  teams: Team[];
  projects: Project[];
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/tasks";
  const searchParams = useSearchParams();

  const route = React.useMemo(
    () =>
      deriveTaskWorkspaceRoute({
        pathname,
        searchParams: searchParams ?? new URLSearchParams(),
        teams,
        projects,
      }),
    [pathname, searchParams, teams, projects],
  );

  const navigate = React.useCallback(
    ({ scope, team: t, project }: TaskWorkspaceNavigation) => {
      // Name the fallback team (deriveTaskWorkspaceRoute picks teams[0]) so the sidebar can highlight it.
      const team =
        t ??
        teams.find((item) => item.id === project?.teamId) ??
        (scope === "team" ? teams[0] : undefined);
      router.push(
        buildTasksUrl({
          scope,
          team: team?.slug,
          project: project?.slug,
          view: route.view,
        }),
        { scroll: false },
      );
    },
    [teams, router, route.view],
  );

  // Lazy read: the first (SSR) render shows the skeleton, so no hydration diff.
  const [storedView, setStoredView] = React.useState(readStoredView);
  const viewMode = resolveTaskViewMode(route.scope, route.view, storedView);
  const setViewMode = React.useCallback(
    (view: TaskViewMode) => {
      storeView(view);
      setStoredView(view);
      const params = new URLSearchParams(searchParams?.toString());
      params.set("view", view);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return { ...route, viewMode, setViewMode, navigate };
}
