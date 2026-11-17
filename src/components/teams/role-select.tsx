"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamRole } from "@/services/team/team-types";
import { ASSIGNABLE_ROLES } from "./team-roles";

type RoleSelectProps = {
  value: TeamRole;
  onChange: (role: TeamRole) => void;
  id?: string;
  /** Accessible name for the trigger, e.g. "Role for Minh Pham". */
  "aria-label"?: string;
};

export function RoleSelect({
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
}: RoleSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as TeamRole)}>
      <SelectTrigger
        id={id}
        size="sm"
        className="w-28 capitalize"
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ASSIGNABLE_ROLES.map((r) => (
          <SelectItem key={r} value={r} className="capitalize">
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
