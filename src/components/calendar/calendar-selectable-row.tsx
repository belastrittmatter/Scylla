"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CalendarSelectableRowProps {
  label: string;
  sublabel?: React.ReactNode;
  avatar?: React.ReactNode;
  icon?: LucideIcon;
  checked: boolean;
  onToggle: () => void;
}

export function CalendarSelectableRow({
  label,
  sublabel,
  avatar,
  icon: Icon,
  checked,
  onToggle,
}: CalendarSelectableRowProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60",
        checked && "bg-accent/40",
      )}
    >
      {avatar ??
        (Icon && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon aria-hidden className="size-3.5" />
          </span>
        ))}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        {sublabel && (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {sublabel}
          </span>
        )}
      </span>
      <Checkbox
        checked={checked}
        aria-hidden
        tabIndex={-1}
        className="pointer-events-none ml-auto"
      />
    </button>
  );
}
