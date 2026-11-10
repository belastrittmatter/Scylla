"use client";

import * as React from "react";
import { getWorkspaceDataAction } from "@/actions";
import type { TaskItem, Team, Project, TaskUser } from "./task-types";
import type { WorkspaceTeamMember } from "@/services/task/workspace-types";

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

export interface TaskWorkspaceData extends WorkspaceCacheSnapshot {
  isLoading: boolean;
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
}

export function useTaskWorkspaceData(): TaskWorkspaceData {
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

  return {
    teams,
    projects,
    tasks,
    users,
    teamMembers,
    isLoading,
    setTeams,
    setTasks,
  };
}
