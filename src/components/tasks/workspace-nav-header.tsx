"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Users, FolderKanban, Plus } from "lucide-react";
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
}

const STATUS_DOTS: Record<string, string> = {
  active: "bg-emerald-500",
  planning: "bg-sky-500",
  paused: "bg-amber-500",
  completed: "bg-purple-500",
};

export function WorkspaceNavHeader({
  teams,
  projects,
  selectedTeamId,
  selectedProjectId,
  onSelectTeam,
  onSelectProject,
  onOpenCreateProject,
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
        {activeProject && (
          <div className="flex items-center gap-1.5 rounded-md border border-neutral-200/80 bg-neutral-50/70 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
            <span
              className={`size-1.5 rounded-full ${
                STATUS_DOTS[activeProject.status] || "bg-neutral-400"
              }`}
            />
            <span className="capitalize">{activeProject.status}</span>
          </div>
        )}
        {onOpenCreateProject && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCreateProject}
            className="h-8 gap-1.5 px-3 text-xs font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
          >
            <Plus className="size-3.5" />
            <span>New Project</span>
          </Button>
        )}
      </div>
    </div>
  );
}
