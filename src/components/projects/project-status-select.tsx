"use client";

import { cn } from "cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectStatus } from "@/services/project/project-types";
import { PROJECT_STATUS_CONFIG } from "./project-status-badge";

const STATUSES = Object.entries(PROJECT_STATUS_CONFIG) as [
  ProjectStatus,
  (typeof PROJECT_STATUS_CONFIG)[ProjectStatus],
][];

/** The same dot and label the list's ProjectStatusBadge shows. */
function StatusOption({ status }: { status: ProjectStatus }) {
  const config = PROJECT_STATUS_CONFIG[status] ?? PROJECT_STATUS_CONFIG.active;
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", config.dotClass)}
      />
      {config.label}
    </span>
  );
}

/** Project status picker, built from PROJECT_STATUS_CONFIG so labels live in one place. */
export function ProjectStatusSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(val) => val && onChange(val as ProjectStatus)}
    >
      <SelectTrigger id={id} className="h-9 w-full text-xs">
        <SelectValue placeholder="Status">
          <StatusOption status={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map(([status]) => (
          <SelectItem key={status} value={status}>
            <StatusOption status={status} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
