"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { MONO_META, WORKSPACE_GUTTER } from "./task-layout";

/**
 * Day widths. Desktop names the span it shows; phones show a fraction of
 * that, so they get zoom icons (named "Zoom in"/"Zoom out") instead of counts.
 */
const ZOOMS = [
  { colW: 64, label: "2 weeks", short: "Zoom in", Icon: ZoomIn },
  { colW: 36, label: "4 weeks", short: "Zoom out", Icon: ZoomOut },
] as const;

interface TaskTimelineToolbarProps {
  /** First and last (partially) visible day; null before the first measure. */
  from: Date | null;
  to: Date | null;
  colW: number;
  onWeek: (dir: 1 | -1) => void;
  onToday: () => void;
  onZoom: (colW: number) => void;
}

export function TaskTimelineToolbar({
  from,
  to,
  colW,
  onWeek,
  onToday,
  onZoom,
}: TaskTimelineToolbarProps) {
  return (
    <div
      className={cn(
        "bg-background flex items-center gap-1 border-b py-1.5",
        WORKSPACE_GUTTER,
      )}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Previous week"
        onClick={() => onWeek(-1)}
      >
        <ChevronLeft />
      </Button>
      <Button variant="outline" size="sm" onClick={onToday}>
        Today
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Next week"
        onClick={() => onWeek(1)}
      >
        <ChevronRight />
      </Button>
      {/* One line at every width: the year drops below sm. */}
      <span
        className={cn(
          MONO_META,
          "ml-2 min-w-0 truncate whitespace-nowrap text-xs text-foreground",
        )}
      >
        {from && to && (
          <>
            {format(from, "MMM d")} – {format(to, "MMM d")}
            <span className="max-sm:hidden">{format(to, ", yyyy")}</span>
          </>
        )}
      </span>
      <Tabs
        value={String(colW)}
        onValueChange={(v) => onZoom(v === "64" ? 64 : 36)}
        className="ml-auto shrink-0"
      >
        <TabsList variant="segmented" aria-label="Timeline zoom">
          {ZOOMS.map((z) => (
            // The visible label (or the phone's sr-only name) is the accessible name.
            <TabsTrigger key={z.colW} value={String(z.colW)}>
              <span className="sm:hidden">
                <z.Icon aria-hidden="true" />
                <span className="sr-only">{z.short}</span>
              </span>
              <span className="max-sm:hidden">{z.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
