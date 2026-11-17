"use client";

import * as React from "react";
import { format, isSameDay, isWeekend } from "date-fns";
import { cn } from "@/lib/utils";
import { MONO_META } from "./task-layout";

interface TaskTimelineDayGridProps {
  dayList: Date[];
  today: Date;
  colW: number;
  gridStyle: React.CSSProperties;
}

const shade = (d: Date) => isWeekend(d) && "bg-muted/40";

/** Day columns behind the rows: weekend shading and the today line. */
export function TaskTimelineDayColumns({
  dayList,
  today,
  gridStyle,
}: Omit<TaskTimelineDayGridProps, "colW">) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid"
      style={gridStyle}
    >
      {dayList.map((d) => (
        <span
          key={d.getTime()}
          className={cn("border-border/40 relative border-l", shade(d))}
        >
          {isSameDay(d, today) && (
            <span className="bg-primary absolute top-8 bottom-0 left-1/2 w-0.5" />
          )}
        </span>
      ))}
    </div>
  );
}

/** Day header row above the bars. */
export function TaskTimelineDayHeader({
  dayList,
  today,
  colW,
  gridStyle,
}: TaskTimelineDayGridProps) {
  return (
    <div
      className={cn(MONO_META, "relative grid h-8 border-b")}
      style={gridStyle}
    >
      {dayList.map((d) => (
        <span
          key={d.getTime()}
          title={format(d, "EEE, MMM d")}
          className={cn(
            "text-muted-foreground flex items-center justify-center truncate",
            shade(d),
            isSameDay(d, today) && "text-primary font-semibold",
          )}
        >
          {format(d, colW > 36 ? "EEE d" : "d")}
        </span>
      ))}
    </div>
  );
}
