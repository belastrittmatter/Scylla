"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface CalendarPanelCardProps {
  title: string;
  meta?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CalendarPanelCard({
  title,
  meta,
  defaultOpen = true,
  children,
}: CalendarPanelCardProps): React.ReactElement {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[10px] border bg-card text-card-foreground shadow-sm"
    >
      <summary className="flex cursor-pointer select-none list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{meta}</span>
        <ChevronDown
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
