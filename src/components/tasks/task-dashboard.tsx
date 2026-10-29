"use client";

import * as React from "react";
import Link from "next/link";
import { Users, FolderKanban, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkspaceNavHeader } from "./workspace-nav-header";
import { TaskViewSwitchBar } from "./task-view-switch-bar";
import { TaskFilterToolbar } from "./task-filter-toolbar";
import { KanbanBoardView } from "./kanban-board-view";
import { TaskTableView } from "./task-table-view";
import { TaskDrawer } from "./task-drawer";
import { ProjectCreateDialog } from "./project-create-dialog";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { TaskWorkspaceSkeleton } from "./task-workspace-skeleton";
import { INITIAL_TASK_FILTERS } from "./task-types";
import { filterTasks, createDraftTask, parseTimestampMs } from "./task-utils";
import { useTaskWorkspaceRouting } from "./use-task-workspace-routing";
import { useTeamAssignees } from "./use-team-assignees";
import { useSession } from "@/lib/auth-client";
import {
  getWorkspaceDataAction,
  updateTaskStatusAction,
  updateTaskAction,
  createTaskAction,
} from "@/actions";
import type {
  TaskItem,
  TaskStatus,
  TaskFilters,
  Team,
  Project,
  TaskUser,
} from "./task-types";
import type { WorkspaceTeamMember } from "@/services/task/workspace-types";

const STATUS_BADGES: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  planning:
    "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
  paused:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  completed:
    "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
};

interface TaskDashboardProps {
  initialTeamSlug?: string;
  initialProjectSlug?: string;
}

interface WorkspaceCacheSnapshot {
  teams: Team[];
  projects: Project[];
  tasks: TaskItem[];
  users: TaskUser[];
  teamMembers: WorkspaceTeamMember[];
}

let clientWorkspaceCache: WorkspaceCacheSnapshot | null = null;
let inflightWorkspaceRequest: ReturnType<typeof getWorkspaceDataAction> | null =
  null;

export function TaskDashboard({
  initialTeamSlug,
  initialProjectSlug,
}: TaskDashboardProps = {}) {
  const [teams, setTeams] = React.useState<Team[]>(
    () => clientWorkspaceCache?.teams ?? [],
  );
  const [projects, setProjects] = React.useState<Project[]>(
    () => clientWorkspaceCache?.projects ?? [],
  );
  const [tasks, setTasks] = React.useState<TaskItem[]>(
    () => clientWorkspaceCache?.tasks ?? [],
  );
  const [users, setUsers] = React.useState<TaskUser[]>(
    () => clientWorkspaceCache?.users ?? [],
  );
  const [teamMembers, setTeamMembers] = React.useState<WorkspaceTeamMember[]>(
    () => clientWorkspaceCache?.teamMembers ?? [],
  );
  const [isLoading, setIsLoading] = React.useState<boolean>(
    () => !clientWorkspaceCache,
  );
  const [viewMode, setViewMode] = React.useState<"kanban" | "table">("kanban");
  const [filters, setFilters] =
    React.useState<TaskFilters>(INITIAL_TASK_FILTERS);
  const [selectedTask, setSelectedTask] = React.useState<TaskItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = React.useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = React.useState(false);
  const { data: session } = useSession();

  const {
    selectedTeamId,
    selectedProjectId,
    handleSelectTeam,
    handleSelectProject,
    handleProjectCreated,
    handleTeamCreated,
  } = useTaskWorkspaceRouting({
    teams,
    projects,
    initialTeamSlug,
    initialProjectSlug,
  });

  const activeTeam = React.useMemo(
    () => teams.find((t) => t.id === selectedTeamId) || null,
    [teams, selectedTeamId],
  );

  const { assignees: drawerUsers } = useTeamAssignees({
    selectedTeamId,
    taskTeamId: selectedTask?.teamId,
    teams,
    allUsers: users,
    initialTeamMembers: teamMembers,
  });

  React.useEffect(() => {
    if (!isLoading) {
      clientWorkspaceCache = { teams, projects, tasks, users, teamMembers };
    }
  }, [isLoading, teams, projects, tasks, users, teamMembers]);

  React.useEffect(() => {
    let isMounted = true;
    if (!inflightWorkspaceRequest) {
      inflightWorkspaceRequest = getWorkspaceDataAction().finally(() => {
        inflightWorkspaceRequest = null;
      });
    }
    inflightWorkspaceRequest
      .then((res) => {
        if (res?.success && res.data) {
          const nextCache: WorkspaceCacheSnapshot = {
            teams: res.data.teams,
            projects: res.data.projects,
            tasks: res.data.tasks,
            users: res.data.users,
            teamMembers: res.data.teamMembers ?? [],
          };
          clientWorkspaceCache = nextCache;
          if (!isMounted) return;
          setTeams(nextCache.teams);
          setProjects(nextCache.projects);
          setTasks(nextCache.tasks);
          setUsers(nextCache.users);
          setTeamMembers(nextCache.teamMembers);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const teamProjects = React.useMemo(
    () => projects.filter((p) => p.teamId === selectedTeamId),
    [projects, selectedTeamId],
  );

  const filteredTasks = React.useMemo(() => {
    if (!selectedTeamId || !selectedProjectId) return [];
    const scoped = tasks.filter(
      (t) => t.teamId === selectedTeamId && t.projectId === selectedProjectId,
    );
    return filterTasks(scoped, filters);
  }, [tasks, selectedTeamId, selectedProjectId, filters]);

  const handleMoveTask = (
    taskId: string,
    status: TaskStatus,
    targetIndex?: number,
  ) => {
    setTasks((prev) => {
      const taskIndex = prev.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;
      const currentTask = prev[taskIndex];

      const now = new Date();
      let totalSpentSeconds = currentTask.totalSpentSeconds || 0;
      let activeSessionStartedAt = currentTask.activeSessionStartedAt;

      if (status === "in_progress" && currentTask.status !== "in_progress") {
        activeSessionStartedAt = now.toISOString();
      } else if (
        currentTask.status === "in_progress" &&
        status !== "in_progress"
      ) {
        if (activeSessionStartedAt) {
          const elapsed = Math.round(
            (now.getTime() - parseTimestampMs(activeSessionStartedAt)) / 1000,
          );
          // Anti-spam filter: discard optimistic elapsed time if moved out in < 1 minute (60s)
          if (elapsed >= 60) {
            totalSpentSeconds += elapsed;
          }
        }
        activeSessionStartedAt = null;
      }

      const updatedTask: TaskItem = {
        ...currentTask,
        status,
        totalSpentSeconds,
        activeSessionStartedAt,
        updatedAt: now,
      };

      const withoutTask = prev.filter((t) => t.id !== taskId);
      const targetColumnTasks = withoutTask.filter((t) => t.status === status);

      let insertIndex = withoutTask.length;
      if (
        targetIndex !== undefined &&
        targetIndex >= 0 &&
        targetIndex < targetColumnTasks.length
      ) {
        const referenceTask = targetColumnTasks[targetIndex];
        insertIndex = withoutTask.findIndex((t) => t.id === referenceTask.id);
      } else if (
        targetIndex !== undefined &&
        targetIndex >= targetColumnTasks.length
      ) {
        if (targetColumnTasks.length > 0) {
          const lastTask = targetColumnTasks[targetColumnTasks.length - 1];
          insertIndex = withoutTask.findIndex((t) => t.id === lastTask.id) + 1;
        }
      }

      const next = [...withoutTask];
      next.splice(insertIndex, 0, updatedTask);
      return next;
    });

    updateTaskStatusAction(taskId, status).catch(console.error);
  };

  const handleUpdateStatus = (taskId: string, status: TaskStatus) => {
    handleMoveTask(taskId, status);
  };

  const handleAddNewTask = (status: TaskStatus) => {
    const activeProj = projects.find((p) => p.id === selectedProjectId) || null;
    const sessionUser = session?.user;
    const currentUser =
      users.find((u) => u.id === sessionUser?.id) ||
      (sessionUser
        ? {
            id: sessionUser.id,
            name: sessionUser.name || "Me",
            email: sessionUser.email || "",
            avatarUrl: sessionUser.image || undefined,
            role: "member",
            initials: sessionUser.name
              ? sessionUser.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "ME",
          }
        : users[0] || null);

    setSelectedTask(
      createDraftTask(
        status,
        selectedTeamId,
        sessionUser?.id || users[0]?.id || "",
        activeProj,
        currentUser,
      ),
    );
    setIsDrawerOpen(true);
  };

  const handleSaveTask = async (item: TaskItem) => {
    const dueIso = item.dueDate ? new Date(item.dueDate).toISOString() : null;
    if (item.id.startsWith("draft-")) {
      const res = await createTaskAction({
        ...item,
        teamId: selectedTeamId,
        projectId: selectedProjectId || item.projectId,
        dueDate: dueIso,
        estimatedMinutes: item.estimatedMinutes ?? 60,
      });
      if (res?.success && res.data) {
        const proj = projects.find((p) => p.id === res.data?.projectId) || null;
        setTasks((prev) => [
          {
            ...res.data!,
            assignee: item.assignee,
            creator: null,
            project: proj,
            totalSpentSeconds: 0,
            activeSessionStartedAt:
              item.status === "in_progress" ? new Date().toISOString() : null,
          },
          ...prev,
        ]);
      }
      return;
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== item.id) return t;

        let totalSpentSeconds = t.totalSpentSeconds || 0;
        let activeSessionStartedAt = t.activeSessionStartedAt;
        const now = new Date();

        if (t.status !== item.status) {
          if (item.status === "in_progress") {
            activeSessionStartedAt = now.toISOString();
          } else if (t.status === "in_progress") {
            if (activeSessionStartedAt) {
              const elapsed = Math.round(
                (now.getTime() - parseTimestampMs(activeSessionStartedAt)) /
                  1000,
              );
              if (elapsed >= 60) {
                totalSpentSeconds += elapsed;
              }
            }
            activeSessionStartedAt = null;
          }
        }

        return {
          ...item,
          totalSpentSeconds,
          activeSessionStartedAt,
        };
      }),
    );
    updateTaskAction(item.id, {
      ...item,
      dueDate: dueIso,
      estimatedMinutes: item.estimatedMinutes ?? 60,
    }).catch(console.error);
  };

  const handleCreatedProject = (p: Project) => {
    setProjects((prev) => [...prev, p]);
    handleProjectCreated(p);
  };

  const handleCreatedTeam = async (data: {
    name: string;
    slug?: string;
    description?: string;
  }) => {
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Failed to create team");
    }
    const created: Team = json.data ?? json;
    setTeams((prev) => [...prev, created]);
    handleTeamCreated(created);
    return created;
  };

  if (isLoading) {
    return <TaskWorkspaceSkeleton />;
  }

  if (teams.length === 0) {
    return (
      <div className="flex h-[calc(100svh-57px)] w-full flex-col items-center justify-center bg-neutral-100/40 p-6 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="shadow-xs flex size-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <Users className="size-7 text-neutral-600 dark:text-neutral-400" />
          </div>
          <h2 className="mt-5 text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            No teams yet
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            Teams organize your projects, tasks, and members in one place.
            Create your first team to get started.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={() => setIsCreateTeamOpen(true)} className="gap-2">
              <Plus className="size-4" />
              <span>Create Team</span>
            </Button>
            <Button variant="outline" render={<Link href="/teams" />}>
              Manage Teams
            </Button>
          </div>
        </div>
        <CreateTeamDialog
          open={isCreateTeamOpen}
          onOpenChange={setIsCreateTeamOpen}
          onCreateTeam={handleCreatedTeam}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-57px)] w-full flex-col overflow-hidden bg-neutral-100/40 dark:bg-neutral-950">
      <WorkspaceNavHeader
        teams={teams}
        projects={teamProjects}
        selectedTeamId={selectedTeamId}
        selectedProjectId={selectedProjectId}
        onSelectTeam={handleSelectTeam}
        onSelectProject={handleSelectProject}
        onOpenCreateProject={
          selectedTeamId ? () => setIsCreateProjectOpen(true) : undefined
        }
      />

      {!selectedTeamId ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:p-8">
          <div className="mx-auto w-full max-w-5xl space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Select a Team
                </h1>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Choose a team to view its projects and tasks, or create a new
                  team to get started.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsCreateTeamOpen(true)}
                  className="gap-2"
                >
                  <Plus className="size-4" />
                  <span>Create Team</span>
                </Button>
                <Button variant="outline" render={<Link href="/teams" />}>
                  Manage Teams
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => {
                const teamProjectCount = projects.filter(
                  (p) => p.teamId === team.id,
                ).length;
                const teamTaskCount = tasks.filter(
                  (t) => t.teamId === team.id,
                ).length;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => handleSelectTeam(team.id)}
                    className="shadow-xs group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 text-left transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex size-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                          <Users className="size-5" />
                        </div>
                        <span className="font-mono text-xs text-neutral-400">
                          @{team.slug}
                        </span>
                      </div>
                      <h3 className="mt-4 font-semibold text-neutral-900 group-hover:text-neutral-950 dark:text-neutral-100 dark:group-hover:text-white">
                        {team.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {team.description || "No description provided"}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                      <div className="flex items-center gap-3">
                        <span>
                          {teamProjectCount}{" "}
                          {teamProjectCount === 1 ? "project" : "projects"}
                        </span>
                        <span>•</span>
                        <span>
                          {teamTaskCount}{" "}
                          {teamTaskCount === 1 ? "task" : "tasks"}
                        </span>
                      </div>
                      <ArrowRight className="size-4 text-neutral-400 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCreateTeamOpen(true)}
                className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-6 text-center transition-all hover:border-neutral-300 hover:bg-neutral-100/50 dark:border-neutral-800 dark:bg-neutral-900/30 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/50"
              >
                <div className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
                  <Plus className="size-5 text-neutral-500 dark:text-neutral-400" />
                </div>
                <span className="mt-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Create New Team
                </span>
                <span className="mt-1 text-xs text-neutral-400">
                  Add a team workspace
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : !selectedProjectId ? (
        teamProjects.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="shadow-xs flex size-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <FolderKanban className="size-7 text-neutral-600 dark:text-neutral-400" />
              </div>
              <h2 className="mt-5 text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                No projects in {activeTeam?.name || "this team"} yet
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Create your first project to start organizing tasks, assigning
                teammates, and tracking progress.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Button
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="gap-2"
                >
                  <Plus className="size-4" />
                  <span>Create Project</span>
                </Button>
                <Button
                  variant="outline"
                  render={
                    <Link
                      href={`/teams/${activeTeam?.slug || selectedTeamId}/projects`}
                    />
                  }
                >
                  Manage Projects
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:p-8">
            <div className="mx-auto w-full max-w-5xl space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    <span>{activeTeam?.name}</span>
                    <span>/</span>
                    <span>Projects</span>
                  </div>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    Select a Project
                  </h1>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Choose a project to open its task board, or create a new
                    project.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsCreateProjectOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="size-4" />
                    <span>Create Project</span>
                  </Button>
                  <Button
                    variant="outline"
                    render={
                      <Link
                        href={`/teams/${activeTeam?.slug || selectedTeamId}/projects`}
                      />
                    }
                  >
                    Manage Projects
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teamProjects.map((project) => {
                  const projectTasks = tasks.filter(
                    (t) => t.projectId === project.id,
                  );
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleSelectProject(project.id)}
                      className="shadow-xs group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 text-left transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="shadow-xs size-3.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: project.color || "#3b82f6",
                              }}
                            />
                            <span className="font-mono text-xs text-neutral-400">
                              @{project.slug}
                            </span>
                          </div>
                          {project.status && (
                            <Badge
                              variant="outline"
                              className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                STATUS_BADGES[project.status] ||
                                "border-neutral-300 bg-neutral-100 text-neutral-800"
                              }`}
                            >
                              {project.status}
                            </Badge>
                          )}
                        </div>
                        <h3 className="mt-4 font-semibold text-neutral-900 group-hover:text-neutral-950 dark:text-neutral-100 dark:group-hover:text-white">
                          {project.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                          {project.description || "No description provided"}
                        </p>
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                        <span className="font-medium">
                          {projectTasks.length}{" "}
                          {projectTasks.length === 1 ? "task" : "tasks"}
                        </span>
                        <ArrowRight className="size-4 text-neutral-400 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-6 text-center transition-all hover:border-neutral-300 hover:bg-neutral-100/50 dark:border-neutral-800 dark:bg-neutral-900/30 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/50"
                >
                  <div className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
                    <Plus className="size-5 text-neutral-500 dark:text-neutral-400" />
                  </div>
                  <span className="mt-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Create New Project
                  </span>
                  <span className="mt-1 text-xs text-neutral-400">
                    Add project to {activeTeam?.name}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        <>
          <TaskViewSwitchBar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            taskCount={filteredTasks.length}
          />
          <TaskFilterToolbar
            filters={filters}
            onFiltersChange={setFilters}
            onResetFilters={() => setFilters(INITIAL_TASK_FILTERS)}
          />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {viewMode === "kanban" ? (
              <KanbanBoardView
                tasks={filteredTasks}
                onSelectTask={(task) => {
                  setSelectedTask(task);
                  setIsDrawerOpen(true);
                }}
                onUpdateStatus={handleUpdateStatus}
                onMoveTask={handleMoveTask}
                onAddNewTask={handleAddNewTask}
              />
            ) : (
              <TaskTableView
                tasks={filteredTasks}
                onSelectTask={(task) => {
                  setSelectedTask(task);
                  setIsDrawerOpen(true);
                }}
                onUpdateStatus={handleUpdateStatus}
              />
            )}
          </div>
        </>
      )}

      <TaskDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        users={drawerUsers}
        onClose={() => setIsDrawerOpen(false)}
        onSaveTask={handleSaveTask}
      />
      <ProjectCreateDialog
        isOpen={isCreateProjectOpen}
        teamId={selectedTeamId}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={handleCreatedProject}
      />
      <CreateTeamDialog
        open={isCreateTeamOpen}
        onOpenChange={setIsCreateTeamOpen}
        onCreateTeam={handleCreatedTeam}
      />
    </div>
  );
}
