"use client";

import * as React from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarPanelCardProps {
  title: string;
  meta?: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  bodyClassName?: string;
  children: React.ReactNode;
}

export function CalendarPanelCard({
  title,
  meta,
  icon: Icon,
  defaultOpen = true,
  bodyClassName,
  children,
}: CalendarPanelCardProps): React.ReactElement {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group rounded-[10px] border bg-card text-card-foreground shadow-sm"
    >
      <summary className="flex cursor-pointer select-none list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
        {Icon && (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon aria-hidden className="size-3.5" />
          </span>
        )}
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{meta}</span>
        <ChevronRight
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
        />
      </summary>
      <div
        className={cn("max-h-[264px] overflow-y-auto px-4 pb-4", bodyClassName)}
      >
        {children}
      </div>
    </details>
  );
}
