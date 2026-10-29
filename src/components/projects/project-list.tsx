"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FolderKanban, Plus, Search } from "lucide-react";
import { ProjectCard } from "@/components/projects/project-card";
import { PROJECT_STATUS_CONFIG } from "@/components/projects/project-status-badge";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import type { ProjectItem } from "@/hooks/use-projects";
import type { ProjectStatus } from "@/services/project/project-types";

interface ProjectListProps {
  teamId: string;
  teamSlug: string;
  projects: ProjectItem[];
  isLoading: boolean;
  onCreateProject: (data: {
    teamId: string;
    name: string;
    slug?: string;
    description?: string;
    status?: ProjectStatus;
    color?: string;
  }) => Promise<ProjectItem>;
  onUpdateProject: (
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      status?: ProjectStatus;
      color?: string | null;
    },
  ) => Promise<ProjectItem>;
  onDeleteProject: (id: string) => Promise<void>;
}

export function ProjectList({
  teamId,
  teamSlug,
  projects,
  isLoading,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(
    null,
  );

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-neutral-400" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
          <div className="w-36">
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val ?? "all")}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Statuses">
                  {statusFilter === "all"
                    ? "All Statuses"
                    : PROJECT_STATUS_CONFIG[statusFilter as ProjectStatus]
                        ?.label || statusFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
          <Plus className="size-4" />
          <span>New Project</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/50"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <FolderKanban className="mx-auto mb-3 size-10 text-neutral-400" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {search || statusFilter !== "all"
              ? "No matching projects"
              : "No projects yet"}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-neutral-500">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or status filter."
              : "Create your first project under this team to start planning and tracking work."}
          </p>
          {!search && statusFilter === "all" && (
            <Button
              onClick={() => setCreateOpen(true)}
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
            >
              <Plus className="size-3.5" />
              New Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              teamSlug={teamSlug}
              project={project}
              onEdit={(p) => setEditingProject(p)}
              onStatusChange={(id, status) => onUpdateProject(id, { status })}
              onDelete={onDeleteProject}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog
        teamId={teamId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateProject={onCreateProject}
      />
      <EditProjectDialog
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        onUpdateProject={onUpdateProject}
      />
    </div>
  );
}
