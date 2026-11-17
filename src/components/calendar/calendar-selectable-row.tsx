"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CalendarSelectableRowProps {
  label: string;
  sublabel?: React.ReactNode;
  meta?: string;
  avatar?: React.ReactNode;
  icon?: LucideIcon;
  checked: boolean;
  onToggle: () => void;
}

export function CalendarSelectableRow({
  label,
  sublabel,
  meta,
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
        "flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50",
        checked && "bg-accent/40",
      )}
    >
      {avatar ??
        (Icon && (
          <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
            <Icon aria-hidden className="size-3.5" />
          </span>
        ))}
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="truncate text-sm font-medium">{label}</span>
          {meta && (
            <span className="shrink-0 font-code text-[11px] tabular-nums text-muted-foreground">
              {meta}
            </span>
          )}
        </span>
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
