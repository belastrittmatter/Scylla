"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarPanelCardProps {
  title: string;
  meta?: string;
  /** Lights the label's dot in ember while the panel holds a selection. */
  active?: boolean;
  defaultOpen?: boolean;
  bodyClassName?: string;
  children: React.ReactNode;
}

/**
 * One collapsible section of the planning rail. Sections carry no frame of
 * their own: the rail wraps them in a single hairline border and splits them
 * with dividers. The header mirrors the landing's mono Eyebrow label.
 * Bodies take their content height: the rail is the only scroller, and long
 * lists cap themselves with a "Show all" row, so no row is cut at a divider.
 */
export function CalendarPanelCard({
  title,
  meta,
  active = false,
  defaultOpen = true,
  bodyClassName,
  children,
}: CalendarPanelCardProps): React.ReactElement {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group text-card-foreground"
    >
      <summary className="flex h-10 cursor-pointer select-none list-none items-center gap-2 px-4 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full transition-colors",
            active ? "bg-primary" : "bg-muted-foreground/40",
          )}
        />
        <h2 className="font-code text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </h2>
        {meta && (
          <span className="ml-auto font-code text-[11px] tabular-nums text-muted-foreground">
            {meta}
          </span>
        )}
        <ChevronRight
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90",
            !meta && "ml-auto",
          )}
        />
      </summary>
      <div
        className={cn("px-3 pb-3", bodyClassName)}
      >
        {children}
      </div>
    </details>
  );
}

/** The row that lifts a rail list's cap: "Show all <noun> +N". */
export function CalendarPanelShowAll({
  noun,
  hiddenCount,
  onShowAll,
}: {
  noun: string;
  hiddenCount: number;
  onShowAll: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onShowAll}
      className="flex h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-left text-xs text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      Show all {noun}
      <span className="font-code text-[11px] tabular-nums">+{hiddenCount}</span>
    </button>
  );
}
