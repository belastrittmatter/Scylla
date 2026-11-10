"use client";

import * as React from "react";
import { FolderKanban, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { plural } from "@/lib/plural";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProjects, type ProjectItem } from "@/hooks/use-projects";
import { CreateProjectDialog } from "./create-project-dialog";
import { EditProjectDialog } from "./edit-project-dialog";
import { ProjectRow } from "./project-row";
import { invalidateTaskWorkspaceCache } from "@/components/tasks/use-task-workspace-data";

type Props = {
  teamId: string;
  teamSlug: string;
  canManage: boolean;
};

export function TeamProjectsTab({ teamId, teamSlug, canManage }: Props) {
  const {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects(teamId);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<ProjectItem | null>(null);
  const [deleting, setDeleting] = React.useState<ProjectItem | null>(null);

  React.useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {plural(projects.length, "project")}
        </p>
        {canManage && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus />
            New project
          </Button>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : projects.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanban />
            </EmptyMedia>
            <EmptyTitle>No projects yet.</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="divide-border divide-y rounded-lg border">
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
