"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { RowActionsMenu } from "@/components/layout/row-actions-menu";
import type { ProjectItem } from "@/hooks/use-projects";
import { buildTasksUrl } from "@/components/tasks/use-task-workspace-routing";
import { ProjectDot } from "./project-dot";
import { ProjectStatusBadge } from "./project-status-badge";

type Props = {
  project: ProjectItem;
  teamSlug: string;
  canManage: boolean;
  onEdit: (project: ProjectItem) => void;
  onDelete: (project: ProjectItem) => void;
};

/** One resource row: the row itself opens the board; the menu sits outside the link. */
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
    <li className="hover:bg-muted/50 flex items-center transition-colors">
      <Link
        href={boardHref}
        aria-label={`Open ${project.name} board`}
        className="focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 pr-2 outline-none focus-visible:ring-[3px] focus-visible:ring-inset"
      >
        <ProjectDot color={project.color} />
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span className="min-w-0 text-sm font-medium break-words sm:flex-1 sm:truncate">
            {project.name}
          </span>
          <ProjectStatusBadge status={project.status} />
        </span>
        <ChevronRight
          aria-hidden
          className="text-muted-foreground size-4 shrink-0"
        />
      </Link>
      {canManage && (
        <div className="shrink-0 pr-2">
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
        </div>
      )}
    </li>
  );
}
