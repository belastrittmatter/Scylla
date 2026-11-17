"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { ListRows } from "@/components/teams/teams-page-skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProjects, type ProjectItem } from "@/hooks/use-projects";
import { CreateProjectDialog } from "./create-project-dialog";
import { EditProjectDialog } from "./edit-project-dialog";
import { ProjectListHead, ProjectRow } from "./project-row";
import { invalidateTaskWorkspaceCache } from "@/components/tasks/use-task-workspace-data";

type Props = {
  teamId: string;
  teamSlug: string;
  canManage: boolean;
  /** Reports the loaded project count (shown on the Projects tab). */
  onCountChange?: (count: number) => void;
};

export function TeamProjectsTab({
  teamId,
  teamSlug,
  canManage,
  onCountChange,
}: Props) {
  const {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refresh,
  } = useProjects(teamId);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<ProjectItem | null>(null);
  const [deleting, setDeleting] = React.useState<ProjectItem | null>(null);
  // The empty state carries its own "New project"; don't show it twice.
  const isEmpty = !isLoading && !error && projects.length === 0;

  React.useEffect(() => {
    if (!isLoading && !error) onCountChange?.(projects.length);
  }, [isLoading, error, projects.length, onCountChange]);

  return (
    <div className="space-y-3">
      {/* The tab carries the count; the toolbar is just the primary action. */}
      {canManage && !isEmpty && (
        <div className="flex min-h-7 items-center justify-end gap-3">
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus />
            New project
          </Button>
        </div>
      )}
      {isLoading ? (
        <ListRows rows={3} />
      ) : error ? (
        <Empty className="border p-6 md:p-8">
          <EmptyHeader>
            <EmptyTitle className="text-sm">
              Couldn&apos;t load projects.
            </EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" variant="outline" onClick={() => refresh()}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : isEmpty ? (
        <Empty className="border p-6 md:p-8">
          <EmptyHeader>
            <EmptyTitle className="text-sm">No projects yet.</EmptyTitle>
            <EmptyDescription>
              {canManage
                ? "Projects group this team's tasks onto one board."
                : "A team owner or admin can create the first project."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage && (
            <EmptyContent>
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus />
                New project
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <ProjectListHead canManage={canManage} />
          <ul className="divide-border divide-y">
            {projects.map((p) => (
              <ProjectRow
                key={p.id}
                project={p}
                teamSlug={teamSlug}
                canManage={canManage}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </ul>
        </div>
      )}
      <CreateProjectDialog
        teamId={teamId}
        open={creating}
        onOpenChange={setCreating}
        onCreateProject={async (data) => {
          const created = await createProject(data);
          invalidateTaskWorkspaceCache();
          return created;
        }}
      />
      <EditProjectDialog
        project={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onUpdateProject={async (id, data) => {
          const updated = await updateProject(id, data);
          invalidateTaskWorkspaceCache();
          return updated;
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "project"}?`}
        description="This permanently deletes the project."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleting) return;
          await deleteProject(deleting.id);
          invalidateTaskWorkspaceCache();
        }}
      />
    </div>
  );
}
