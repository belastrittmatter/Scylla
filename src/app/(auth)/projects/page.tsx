"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useTeams } from "@/hooks/use-teams";
import { useProjects } from "@/hooks/use-projects";
import { ProjectList } from "@/components/projects/project-list";
import { FolderKanban, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const { teams, isLoading: isTeamsLoading } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Select first team when teams load if none is selected
  const activeTeamId = selectedTeamId || (teams.length > 0 ? teams[0].id : "");
  const activeTeam = teams.find((t) => t.id === activeTeamId);

  const {
    projects,
    isLoading: isProjectsLoading,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects(activeTeamId || undefined);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center dark:border-neutral-800">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
              <FolderKanban className="size-4.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Projects
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            View and manage projects organized under your teams.
          </p>
        </div>

        {teams.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Team:</span>
            <Select
              value={activeTeamId}
              onValueChange={(val) => val && setSelectedTeamId(val)}
            >
              <SelectTrigger className="h-9 w-[180px] text-xs">
                <SelectValue placeholder="Select team">
                  {activeTeam ? activeTeam.name : "Select team"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              render={<Link href={`/teams/${activeTeam?.slug}/projects`} />}
            >
              Open Team Workspace
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      {isTeamsLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <Users className="mx-auto mb-3 size-10 text-neutral-400" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            No teams found
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-neutral-500">
            Projects must belong to a team. Create a team first to start adding
            projects.
          </p>
          <Button
            size="sm"
            className="mt-4 gap-2"
            render={<Link href="/teams" />}
          >
            <Plus className="size-3.5" />
            Go to Teams
          </Button>
        </div>
      ) : (
        <ProjectList
          teamId={activeTeamId}
          teamSlug={activeTeam?.slug ?? ""}
          projects={projects}
          isLoading={isProjectsLoading}
          onCreateProject={createProject}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
        />
      )}
    </div>
  );
}
