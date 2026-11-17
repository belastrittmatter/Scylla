"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import type { ProjectStatus } from "@/services/project/project-types";

/**
 * Status reads from the label and a small dot; no fill washes (taste T3).
 * Dots stay monochrome tokens so ember keeps meaning "primary action / active state".
 * `colorClass` is the label tone, `dotClass` the dot.
 */
export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; colorClass: string; dotClass: string }
> = {
  planning: {
    label: "Planning",
    colorClass: "text-muted-foreground",
    dotClass: "border border-foreground/70 bg-transparent",
  },
  active: {
    label: "Active",
    colorClass: "text-foreground",
    dotClass: "bg-foreground",
  },
  paused: {
    label: "Paused",
    colorClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  completed: {
    label: "Completed",
    colorClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground/50",
  },
  archived: {
    label: "Archived",
    colorClass: "text-muted-foreground",
    dotClass: "border border-dashed border-muted-foreground",
  },
};

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const config = PROJECT_STATUS_CONFIG[status] || PROJECT_STATUS_CONFIG.active;
  return (
    <Badge
      variant="meta"
      className={cn("gap-1.5", config.colorClass, className)}
    >
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", config.dotClass)}
      />
      {config.label}
    </Badge>
  );
}
