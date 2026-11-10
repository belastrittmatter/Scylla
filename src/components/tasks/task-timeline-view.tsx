"use client";

import * as React from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  isWeekend,
  startOfWeek,
} from "date-fns";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { getVisibleDays } from "./task-timeline";
import { BAND, buildGroups, DAYS } from "./task-timeline-groups";
import { TaskTimelineNamePane } from "./task-timeline-name-pane";
import { TaskTimelineToolbar } from "./task-timeline-toolbar";
import { TaskTimelineBars } from "./task-timeline-row";
import type { TaskItem } from "./task-types";

interface TaskTimelineViewProps {
  tasks: TaskItem[];
  getContextLabel?: (task: TaskItem) => string | null;
  onSelectTask: (task: TaskItem) => void;
}

/** Gantt-style view: createdAt → dueDate bars on a horizontally scrollable day grid. */
export function TaskTimelineView({
  tasks,
  getContextLabel,
  onSelectTask,
}: TaskTimelineViewProps) {
  const [colW, setColW] = React.useState(36);
  const [label, setLabel] = React.useState("");
  const scroller = React.useRef<HTMLDivElement>(null);
  const anchor = React.useRef<number | null>(null); // day index to keep left on zoom
  const [start] = React.useState(() =>
    startOfWeek(addDays(new Date(), -56), { weekStartsOn: 1 }),
  );
  const today = new Date();
  const todayIdx = differenceInCalendarDays(today, start);
  const dayList = Array.from({ length: DAYS }, (_, i) => addDays(start, i));
  const gridStyle = {
    gridTemplateColumns: `repeat(${DAYS}, ${colW}px)`,
    width: DAYS * colW,
  };
  const groups = buildGroups(tasks, start, getContextLabel);
  const unscheduled = tasks.filter((t) => !t.dueDate && t.status !== "done");

  const updateLabel = React.useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const { first, last } = getVisibleDays(
      el.scrollLeft,
      el.clientWidth,
      colW,
      DAYS,
    );
    setLabel(
      `${format(addDays(start, first), "MMM d")} – ${format(addDays(start, last), "MMM d, yyyy")}`,
    );
  }, [colW, start]);

  // Mount: today into view; zoom: keep the same first visible day.
  React.useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollLeft =
      anchor.current !== null
        ? anchor.current * colW
        : Math.max(0, todayIdx * colW - el.clientWidth / 3);
    updateLabel();
    const ro = new ResizeObserver(updateLabel);
    ro.observe(el);
    return () => ro.disconnect();
  }, [colW, todayIdx, updateLabel]);

  const scrollByWeek = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * 7 * colW, behavior: "smooth" });
  const scrollToToday = () =>
    scroller.current?.scrollTo({
      left: Math.max(0, todayIdx * colW - scroller.current.clientWidth / 3),
      behavior: "smooth",
    });
  const zoom = (next: number) => {
    anchor.current = Math.floor((scroller.current?.scrollLeft ?? 0) / colW);
    setColW(next);
  };

  const shade = (d: Date) => isWeekend(d) && "bg-muted/40";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TaskTimelineToolbar
        label={label}
        colW={colW}
        onWeek={scrollByWeek}
        onToday={scrollToToday}
        onZoom={zoom}
      />

      {/* One vertical scroller, so name rows and grid rows can never drift apart. */}
      <div className="bg-background min-h-0 flex-1 overflow-y-auto">
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="task-timeline-pane"
          style={{ height: "auto", minHeight: "100%", overflow: "visible" }}
        >
          <ResizablePanel defaultSize={25} minSize={15} maxSize={45}>
            <TaskTimelineNamePane
              groups={groups}
              unscheduled={unscheduled}
              onSelect={onSelectTask}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>
            <div
              ref={scroller}
              onScroll={updateLabel}
              className="h-full overflow-x-auto"
            >
              <div
                className="relative min-h-full"
                style={{ width: DAYS * colW }}
              >
                {/* Day columns behind the rows: weekend shading and the today line. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 grid"
                  style={gridStyle}
                >
                  {dayList.map((d) => (
                    <span
                      key={d.getTime()}
                      className={cn(
                        "border-border/40 relative border-l",
                        shade(d),
                      )}
                    >
                      {isSameDay(d, today) && (
                        <span className="bg-primary absolute inset-y-0 left-1/2 w-0.5" />
                      )}
                    </span>
                  ))}
                </div>
                <div
                  className="relative grid h-8 border-b text-xs"
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
                {[...groups].map(([name, rows]) => (
                  <React.Fragment key={name}>
                    {name && (
                      <div className={cn(BAND, "relative")} aria-hidden />
                    )}
                    {rows.map((r) => (
                      <TaskTimelineBars
                        key={r.task.id}
                        {...r}
                        gridStyle={gridStyle}
                        onSelect={onSelectTask}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
