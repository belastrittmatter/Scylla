"use client";

import * as React from "react";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { useSession } from "@/lib/auth-client";
import { TaskHeaderBar } from "./task-header-bar";
import { TaskTeamBreadcrumb } from "./task-team-breadcrumb";
import { TaskFilterChips } from "./task-filter-chips";
import { buildTaskFilterDefs } from "./task-filter-defs";
import { TaskScopeContent } from "./task-scope-content";
import { TaskScopeEmptyState } from "./task-scope-empty-state";
import { TaskDrawer } from "./task-drawer";
import { TaskWorkspaceSkeleton } from "./task-workspace-skeleton";
import { useTaskWorkspaceData } from "./use-task-workspace-data";
import { useTaskBoardState } from "./use-task-board-state";
import { useTaskEditor } from "./use-task-editor";
import { useTaskWorkspaceRouting } from "./use-task-workspace-routing";
import { useTeamAssignees } from "./use-team-assignees";
import { useTeams } from "@/hooks/use-teams";
import { useScopedTasks } from "./use-scoped-tasks";
import { makeCanDeleteTask } from "./task-selectors";
import { INITIAL_TASK_FILTERS } from "./task-types";
import type { TaskFilters, TaskStatus, Team } from "./task-types";

export function TaskDashboard() {
  const { teams, projects, tasks, users, teamMembers, isLoading, ...setters } =
    useTaskWorkspaceData();
  const { setTeams, setTasks } = setters;
  const { handleMoveTask, handleDeleteTasks } = useTaskBoardState(
    tasks,
    setTasks,
  );
  const { data: session, isPending: isSessionPending } = useSession();
  const { scope, team, project, viewMode, setViewMode, navigate } =
    useTaskWorkspaceRouting({ teams, projects });
  const teamId = team?.id ?? "";
  const teamProjects = projects.filter((p) => p.teamId === teamId);
  const projectId = project?.id ?? "";
  const userId = session?.user?.id;
  const canDelete = makeCanDeleteTask(teams, teamMembers, userId);

  const [filters, setFilters] =
    React.useState<TaskFilters>(INITIAL_TASK_FILTERS);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = React.useState(false);

  const editor = useTaskEditor({
    projects,
    users,
    sessionUser: session?.user,
    setTasks,
  });
  const { selectedTask } = editor;
  const { assignees } = useTeamAssignees({
    selectedTeamId: teamId,
    taskTeamId: selectedTask?.teamId,
    teams,
    allUsers: users,
    initialTeamMembers: teamMembers,
  });
  // Empty initial list skips useTeams' mount fetch; the workspace payload already has teams.
  const { createTeam } = useTeams([]);
  const handleCreateTeam: typeof createTeam = async (data) => {
    const created = await createTeam(data);
    // useTeams serialises dates; the workspace list only reads id/name/slug.
    const team = created as unknown as Team;
    setTeams((prev) => [...prev, team]);
    navigate({ scope: "team", team });
    return created;
  };

  const { visibleTasks, getContextLabel, emptyKind } = useScopedTasks({
    tasks,
    teams,
    projects,
    scope,
    viewMode,
    userId,
    teamId,
    projectId,
    filters,
  });

  if (isLoading || (scope === "me" && isSessionPending)) {
    return <TaskWorkspaceSkeleton />;
  }

  const filterDefs = buildTaskFilterDefs({
    filters,
    onFiltersChange: setFilters,
    hidesClosed: scope === "me" && viewMode === "list",
  });
  const clearFilters = () => setFilters(INITIAL_TASK_FILTERS);

  // shortcut: outside a team the drawer has no team picker, so new tasks land in the first team; add a picker if users ask.
  const addTask = (status: TaskStatus = "todo") =>
    editor.openDraft(status, teamId || teams[0]?.id || "", projectId);

  return (
    <div className="bg-muted/30 flex h-full w-full flex-col overflow-hidden">
      {teams.length === 0 ? (
        <TaskScopeEmptyState
          kind="no_teams"
          onAction={() => setIsCreateTeamOpen(true)}
        />
      ) : (
        <>
          <TaskHeaderBar
            scope={scope}
            onScopeChange={(next) =>
              navigate(
                next === "team"
                  ? { scope: next, team, project }
                  : { scope: next },
              )
            }
            crumbs={
              scope === "team" && (
                <TaskTeamBreadcrumb
                  teams={teams}
                  projects={teamProjects}
                  team={team}
                  project={project}
                  onSelectTeam={(t) => navigate({ scope, team: t })}
                  onSelectProject={(p) => navigate({ scope, team, project: p })}
                  onCreateTeam={() => setIsCreateTeamOpen(true)}
                />
              )
            }
            searchQuery={filters.searchQuery}
            onSearchChange={(searchQuery) =>
              setFilters({ ...filters, searchQuery })
            }
            filterDefs={filterDefs}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNewTask={() => addTask()}
          />
          <TaskFilterChips
            defs={filterDefs}
            searchQuery={filters.searchQuery}
            onClearSearch={() => setFilters({ ...filters, searchQuery: "" })}
            onClearAll={clearFilters}
          />
          <TaskScopeContent
            scope={scope}
            viewMode={viewMode}
            tasks={visibleTasks}
            emptyKind={emptyKind}
            onEmptyAction={
              emptyKind === "filtered" ? clearFilters : () => addTask()
            }
            emptySecondary={
              scope === "me"
                ? {
                    label: "Browse team tasks",
                    onClick: () => navigate({ scope: "team" }),
                  }
                : undefined
            }
            getContextLabel={getContextLabel}
            showAssignee={scope !== "me"}
            onSelectTask={editor.openTask}
            onUpdateStatus={handleMoveTask}
            onAddNewTask={addTask}
            onDeleteTasks={handleDeleteTasks}
            canDeleteTask={canDelete}
          />
        </>
      )}

      <TaskDrawer
        task={selectedTask}
        isOpen={editor.isDrawerOpen}
        users={assignees}
        onClose={editor.closeDrawer}
        onSaveTask={editor.saveTask}
        onDeleteTask={
          selectedTask && canDelete(selectedTask)
            ? () => handleDeleteTasks([selectedTask.id])
            : undefined
        }
      />
      <CreateTeamDialog
        open={isCreateTeamOpen}
        onOpenChange={setIsCreateTeamOpen}
        onCreateTeam={handleCreateTeam}
      />
    </div>
  );
}
