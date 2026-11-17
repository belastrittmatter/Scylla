"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { RowActionsMenu } from "@/components/layout/row-actions-menu";
import { ListHead } from "@/components/ui/list-head";
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

/** Column widths shared by the head and the rows so the columns line up. */
const UPDATED_COL = "w-32 shrink-0";
const STATUS_COL = "w-24 shrink-0";
/** The row menu's footprint: icon-sm button plus its right inset. */
const MENU_COL = "w-9 shrink-0";
/** The head's stand-in for that menu: MENU_COL minus the head's extra gap. */
const MENU_HEAD = "w-6 shrink-0";

function toDate(value: ProjectItem["updatedAt"]) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function ProjectListHead({ canManage }: { canManage: boolean }) {
  return (
    <ListHead className="gap-3 pr-2">
      {/* Holds the colour dot's place so the label sits over the names. */}
      <span aria-hidden className="size-2.5 shrink-0" />
      <span className="min-w-0 flex-1">Project</span>
      <span className={`${UPDATED_COL} hidden sm:block`}>Updated</span>
      <span className={STATUS_COL}>Status</span>
      <span aria-hidden className="hidden size-4 shrink-0 sm:block" />
      {canManage && <span aria-hidden className={MENU_HEAD} />}
    </ListHead>
  );
}

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
  const updated = toDate(project.updatedAt);
  return (
    <li className="hover:bg-muted/50 flex items-center transition-colors">
      <Link
        href={boardHref}
        aria-label={`Open ${project.name} board`}
        className="focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-2 outline-none focus-visible:ring-[3px] focus-visible:ring-inset"
      >
        <ProjectDot color={project.color} />
        <span className="min-w-0 flex-1">
          {/* Wraps at 390 so the name is never cut; one line from sm. */}
          <span className="block text-sm font-medium break-words sm:truncate">
            {project.name}
          </span>
          <span className="text-muted-foreground block truncate font-mono text-xs">
            /{project.slug}
          </span>
        </span>
        <span
          className={`${UPDATED_COL} text-muted-foreground hidden truncate font-mono text-xs tabular-nums sm:block`}
        >
          {updated && (
            <time dateTime={updated.toISOString()}>
              {formatDistanceToNowStrict(updated, { addSuffix: true })}
            </time>
          )}
        </span>
        <span className={STATUS_COL}>
          <ProjectStatusBadge status={project.status} />
        </span>
        <ChevronRight
          aria-hidden
          className="text-muted-foreground hidden size-4 shrink-0 sm:block"
        />
      </Link>
      {canManage && (
        <div className={`${MENU_COL} pr-2`}>
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
