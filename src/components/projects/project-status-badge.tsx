"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { ProjectStatus } from "@/services/project/project-types";

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; colorClass: string; dotClass: string }
> = {
  planning: {
    label: "Planning",
    colorClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  active: {
    label: "Active",
    colorClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  paused: {
    label: "Paused",
    colorClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    colorClass:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-purple-500",
  },
  archived: {
    label: "Archived",
    colorClass:
      "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
    dotClass: "bg-neutral-400",
  },
};

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  onStatusChange?: (newStatus: ProjectStatus) => void;
}

export function ProjectStatusBadge({
  status,
  onStatusChange,
}: ProjectStatusBadgeProps) {
  const config = PROJECT_STATUS_CONFIG[status] || PROJECT_STATUS_CONFIG.active;

  if (!onStatusChange) {
    return (
      <Badge
        variant="outline"
        className={`gap-1.5 border px-2 py-0.5 text-[11px] font-medium ${config.colorClass}`}
      >
        <span className={`size-1.5 rounded-full ${config.dotClass}`} />
        {config.label}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors hover:opacity-80 ${config.colorClass}`}
          >
            <span className={`size-1.5 rounded-full ${config.dotClass}`} />
            <span>{config.label}</span>
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-36">
        {(Object.keys(PROJECT_STATUS_CONFIG) as ProjectStatus[]).map((s) => {
          const item = PROJECT_STATUS_CONFIG[s];
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => onStatusChange(s)}
              className="cursor-pointer gap-2 text-xs"
            >
              <span className={`size-2 rounded-full ${item.dotClass}`} />
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
