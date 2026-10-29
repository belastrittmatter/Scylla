"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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

export function buildTaskWorkspaceUrl(
  teamSlug: string,
  projectSlug?: string | null,
): string {
  if (!projectSlug || projectSlug === "all") {
    return `/tasks/${teamSlug}`;
  }
  return `/tasks/${teamSlug}/${projectSlug}`;
}

export interface UseTaskWorkspaceRoutingOptions {
  teams: Team[];
  projects: Project[];
  initialTeamSlug?: string;
  initialProjectSlug?: string;
}

export function useTaskWorkspaceRouting({
  teams,
  projects,
  initialTeamSlug,
  initialProjectSlug,
}: UseTaskWorkspaceRoutingOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isTasksPath = Boolean(pathname && pathname.startsWith("/tasks"));

  // Extract path slugs from current Next.js pathname if on a task route
  const pathSlugs = React.useMemo(() => {
    if (!isTasksPath || !pathname) return [];
    return pathname
      .replace(/^\/tasks\/?/, "")
      .split("/")
      .filter(Boolean);
  }, [isTasksPath, pathname]);

  const pathTeamSlug = isTasksPath ? pathSlugs[0] : initialTeamSlug;
  const pathProjSlug = isTasksPath ? pathSlugs[1] : initialProjectSlug;

  const queryTeam = searchParams?.get("team") || searchParams?.get("teamId");
  const queryProjectId =
    searchParams?.get("projectId") || searchParams?.get("project");

  // Derive the active team strictly from URL path or query params
  const activeTeam = React.useMemo(() => {
    if (teams.length === 0) return undefined;

    if (queryProjectId) {
      const p = findProjectBySlugOrId(projects, queryProjectId);
      if (p) {
        const t = teams.find((item) => item.id === p.teamId);
        if (t) return t;
      }
    }

    return (
      findTeamBySlugOrId(teams, pathTeamSlug) ||
      findTeamBySlugOrId(teams, queryTeam)
    );
  }, [teams, pathTeamSlug, queryTeam, queryProjectId, projects]);

  // Derive the active project within the active team strictly from URL path or query params
  const activeProject = React.useMemo(() => {
    if (!activeTeam) return undefined;
    const teamProjs = projects.filter((p) => p.teamId === activeTeam.id);

    if (queryProjectId && queryProjectId !== "all") {
      const p = findProjectBySlugOrId(teamProjs, queryProjectId);
      if (p) return p;
    }

    return findProjectBySlugOrId(teamProjs, pathProjSlug);
  }, [activeTeam, projects, pathProjSlug, queryProjectId]);

  const selectedTeamId = activeTeam?.id || "";
  const selectedProjectId = activeProject?.id || "";

  // Canonicalize legacy query-param URLs (?teamId=...&projectId=...) to slug paths
  React.useEffect(() => {
    if (!activeTeam || (!queryTeam && !queryProjectId)) return;
    const targetUrl = buildTaskWorkspaceUrl(
      activeTeam.slug,
      activeProject ? activeProject.slug : null,
    );
    if (pathname?.startsWith("/tasks") && pathname !== targetUrl) {
      router.replace(targetUrl, { scroll: false });
    }
  }, [activeTeam, activeProject, queryTeam, queryProjectId, pathname, router]);

  const handleSelectTeam = React.useCallback(
    (teamIdOrSlug: string) => {
      const targetTeam = findTeamBySlugOrId(teams, teamIdOrSlug);
      if (!targetTeam) return;

      const targetUrl = buildTaskWorkspaceUrl(targetTeam.slug);
      router.push(targetUrl, { scroll: false });
    },
    [teams, router],
  );

  const handleSelectProject = React.useCallback(
    (projectIdOrSlug: string) => {
      if (!activeTeam) return;

      const teamProjs = projects.filter((p) => p.teamId === activeTeam.id);
      const targetProj = findProjectBySlugOrId(teamProjs, projectIdOrSlug);
      if (!targetProj) return;

      const targetUrl = buildTaskWorkspaceUrl(activeTeam.slug, targetProj.slug);
      router.push(targetUrl, { scroll: false });
    },
    [activeTeam, projects, router],
  );

  const handleProjectCreated = React.useCallback(
    (created: Project) => {
      if (!activeTeam) return;
      const targetUrl = buildTaskWorkspaceUrl(activeTeam.slug, created.slug);
      router.push(targetUrl, { scroll: false });
    },
    [activeTeam, router],
  );

  const handleTeamCreated = React.useCallback(
    (created: Team) => {
      const targetUrl = buildTaskWorkspaceUrl(created.slug);
      router.push(targetUrl, { scroll: false });
    },
    [router],
  );

  return {
    selectedTeamId,
    selectedProjectId,
    activeTeam,
    activeProject,
    handleSelectTeam,
    handleSelectProject,
    handleProjectCreated,
    handleTeamCreated,
  };
}
