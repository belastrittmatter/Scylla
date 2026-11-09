"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Users, FolderKanban, Plus, Settings } from "lucide-react";
import { TeamSearchPicker } from "./team-search-picker";
import { ProjectSearchPicker } from "./project-search-picker";
import type { Team, Project } from "@/db/schema";

interface WorkspaceNavHeaderProps {
  teams: Team[];
  projects: Project[];
  selectedTeamId: string;
  selectedProjectId: string;
  onSelectTeam: (teamId: string) => void;
  onSelectProject: (projectId: string) => void;
  onOpenCreateProject?: () => void;
  onAddNewTask?: () => void;
  onSyncGithub?: () => void;
  isSyncingGithub?: boolean;
}

export function WorkspaceNavHeader({
  teams,
  projects,
  selectedTeamId,
  selectedProjectId,
  onSelectTeam,
  onSelectProject,
  onOpenCreateProject,
  onAddNewTask,
  onSyncGithub,
  isSyncingGithub,
}: WorkspaceNavHeaderProps) {
  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="shadow-xs flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/80 bg-white/90 px-6 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/90">
      <Breadcrumb className="flex flex-wrap items-center">
        <BreadcrumbList className="gap-3">
          <BreadcrumbItem>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-neutral-400" />
              <TeamSearchPicker
                teams={teams}
                selectedTeamId={selectedTeamId}
                onSelectTeam={onSelectTeam}
              />
            </div>
          </BreadcrumbItem>

          <BreadcrumbSeparator className="text-neutral-300 dark:text-neutral-700" />

          <BreadcrumbItem>
            <div className="flex items-center gap-2">
              <FolderKanban className="size-4 text-neutral-400" />
              <ProjectSearchPicker
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={onSelectProject}
                disabled={projects.length === 0}
              />
            </div>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        {activeProject?.githubRepo && onSyncGithub && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncGithub}
            disabled={isSyncingGithub}
            className="h-8 gap-1.5 px-2.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            title={`Sync issues from GitHub (${activeProject.githubRepo})`}
          >
            <svg
              className={`size-3.5 fill-current ${
                isSyncingGithub ? "animate-spin" : ""
              }`}
              viewBox="0 0 24 24"
            >
              <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
            </svg>
            <span>{isSyncingGithub ? "Syncing..." : "Sync GitHub"}</span>
          </Button>
        )}
        {onOpenCreateProject && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCreateProject}
            className="h-8 gap-1.5 px-2.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            title="Create new project"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        )}
        {activeProject && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            render={<Link href={`/projects/${activeProject.id}/settings`} />}
            title="Project Settings"
          >
            <Settings className="size-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        )}
        {onAddNewTask && (
          <Button
            size="sm"
            onClick={onAddNewTask}
            className="h-8 gap-1.5 px-3 text-xs font-medium"
          >
            <Plus className="size-3.5" />
            <span>New Task</span>
          </Button>
        )}
      </div>
    </div>
  );
}
