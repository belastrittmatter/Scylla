"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RowActionsMenu } from "@/components/layout/row-actions-menu";
import type { ProjectItem } from "@/hooks/use-projects";
import { buildTasksUrl } from "@/components/tasks/use-task-workspace-routing";
import { ProjectDot } from "./project-dot";
import { ProjectStatusBadge } from "./project-status-badge";

interface Props {
  project: ProjectItem;
  teamSlug: string;
  canManage: boolean;
  onEdit: (project: ProjectItem) => void;
  onDelete: (project: ProjectItem) => void;
}

export function ProjectRow({
  project,
  teamSlug,
  canManage,
  onEdit,
  onDelete,
}: Props) {
  const boardHref = buildTasksUrl({
    scope: "team",
    team: teamSlug,
    project: project.slug,
  });
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <ProjectDot color={project.color} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {project.name}
      </span>
      <ProjectStatusBadge status={project.status} />
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={boardHref} />}
        aria-label={`Open ${project.name} board`}
      >
        <ExternalLink />
        Board
      </Button>
      {canManage && (
        <RowActionsMenu
          label={`Actions for ${project.name}`}
          actions={[
            {
              label: "Edit",
              icon: <Pencil />,
              onSelect: () => onEdit(project),
            },
            {
              label: "Delete",
              icon: <Trash2 />,
              destructive: true,
              onSelect: () => onDelete(project),
            },
          ]}
        />
      )}
    </li>
  );
}
