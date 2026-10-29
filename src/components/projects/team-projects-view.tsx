"use client";

import * as React from "react";
import Link from "next/link";
import { Users, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBreadcrumb } from "@/components/layout/breadcrumb-context";
import { ProjectList } from "@/components/projects/project-list";
import { useProjects } from "@/hooks/use-projects";

interface TeamProjectsViewProps {
  team: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
}

export function TeamProjectsView({ team }: TeamProjectsViewProps) {
  const { setLabel } = useBreadcrumb();
  const {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects(team.id);

  React.useEffect(() => {
    setLabel(team.slug, team.name);
  }, [team.slug, team.name, setLabel]);

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-6 p-6 md:p-8">
      {/* Navigation & Header */}
      <div className="space-y-4 border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center">
                <FolderKanban className="size-4.5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {team.name} Projects
              </h1>
            </div>
            <p className="max-w-2xl text-xs text-neutral-500 dark:text-neutral-400">
              {team.description ||
                `Manage and track projects for team /${team.slug}`}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 self-start text-xs sm:self-auto"
            render={<Link href="/teams" />}
          >
            <Users className="size-3.5" />
            <span>Manage Team</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Projects List with Filtering and CRUD */}
      <ProjectList
        teamId={team.id}
        teamSlug={team.slug}
        projects={projects}
        isLoading={isLoading}
        onCreateProject={createProject}
        onUpdateProject={updateProject}
        onDeleteProject={deleteProject}
      />
    </div>
  );
}
