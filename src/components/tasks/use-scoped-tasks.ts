"use client";

import * as React from "react";
import {
  hideClosedTasks,
  selectScopedTasks,
  type TaskScope,
} from "./task-selectors";
import { filterTasks } from "./task-utils";
import { INITIAL_TASK_FILTERS } from "./task-types";
import type { TaskViewMode } from "./task-scope-content";
import type { TaskEmptyKind } from "./task-scope-empty-state";
import type { Project, TaskFilters, TaskItem, Team } from "./task-types";

interface UseScopedTasksArgs {
  tasks: TaskItem[];
  teams: Team[];
  projects: Project[];
  scope: TaskScope;
  viewMode: TaskViewMode;
  userId?: string;
  teamId: string;
  projectId: string;
  filters: TaskFilters;
}

/**
 * Scope, hide finished work, then filter. Me/All lists hide done+cancelled; the timeline
 * keeps done (what landed in the sprint) but drops cancelled; boards keep everything.
 */
export function selectVisibleTasks({
  tasks,
  scope,
  viewMode,
  userId,
  teamId,
  projectId,
  filters,
}: Omit<UseScopedTasksArgs, "teams" | "projects">): TaskItem[] {
  const scoped = selectScopedTasks({ tasks, scope, userId, teamId, projectId });
  let open = scoped;
  if (viewMode === "list" && scope === "me") {
    open = hideClosedTasks(scoped, filters.status);
  } else if (viewMode === "timeline" && filters.status === "all") {
    open = scoped.filter((t) => t.status !== "cancelled");
  }
  return filterTasks(open, filters);
}

/** Visible tasks, row context label, filter state, and empty-state kind for a scope. */
export function useScopedTasks({
  tasks,
  teams,
  projects,
  scope,
  viewMode,
  userId,
  teamId,
  projectId,
  filters,
}: UseScopedTasksArgs) {
  const visibleTasks = React.useMemo(
    () =>
      selectVisibleTasks({
        tasks,
        scope,
        viewMode,
        userId,
        teamId,
        projectId,
        filters,
      }),
    [tasks, scope, viewMode, userId, teamId, projectId, filters],
  );

  // Context is redundant inside a single project; Team scope only needs the project.
  const getContextLabel = React.useMemo(() => {
    if (scope === "team" && projectId) return undefined;
    const teamNames = new Map(teams.map((t) => [t.id, t.name]));
    const projectNames = new Map(projects.map((p) => [p.id, p.name]));
    return (task: TaskItem): string | null => {
      const project = task.projectId ? projectNames.get(task.projectId) : null;
      if (scope === "team") return project ?? null;
      const parts = [teamNames.get(task.teamId), project].filter(Boolean);
      return parts.join(" · ") || null;
    };
  }, [scope, projectId, teams, projects]);

  const isFiltered =
    JSON.stringify(filters) !== JSON.stringify(INITIAL_TASK_FILTERS);
  let emptyKind: TaskEmptyKind | null = null;
  if (visibleTasks.length === 0) {
    if (isFiltered) emptyKind = "filtered";
    else if (scope === "team") emptyKind = projectId ? "project" : "team";
    else emptyKind = scope;
  }

  return { visibleTasks, getContextLabel, emptyKind };
}
