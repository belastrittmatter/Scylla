"use client";

import * as React from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfWeek,
} from "date-fns";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { getVisibleDays } from "./task-timeline";
import {
  TaskTimelineDayColumns,
  TaskTimelineDayHeader,
} from "./task-timeline-day-grid";
import { BAND, buildGroups, DAYS } from "./task-timeline-groups";
import { TaskTimelineNamePane } from "./task-timeline-name-pane";
import { TaskTimelineToolbar } from "./task-timeline-toolbar";
import { TaskTimelineBars } from "./task-timeline-row";
import type { TaskItem } from "./task-types";
import { useTimelineDragCreate } from "./use-timeline-drag-create";

interface TaskTimelineViewProps {
  tasks: TaskItem[];
  getContextLabel?: (task: TaskItem) => string | null;
  onSelectTask: (task: TaskItem) => void;
  /** Set to enable drag-to-create on empty grid space (first day 09:00 → last day 18:00). */
  onCreateRange?: (startDate: Date, dueDate: Date) => void;
}

/** Gantt-style view: startDate (or createdAt) → dueDate bars on a horizontally scrollable day grid. */
export function TaskTimelineView({
  tasks,
  getContextLabel,
  onSelectTask,
  onCreateRange,
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
  const { range, handlers } = useTimelineDragCreate({
    colW,
    days: DAYS,
    rangeStart: start,
    onCreateRange,
  });

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
                className="relative min-h-full select-none"
                style={{ width: DAYS * colW }}
                {...handlers}
              >
                <TaskTimelineDayColumns
                  dayList={dayList}
                  today={today}
                  gridStyle={gridStyle}
                />
                <TaskTimelineDayHeader
                  dayList={dayList}
                  today={today}
                  colW={colW}
                  gridStyle={gridStyle}
                />
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
                {range && (
                  <div
                    aria-hidden
                    className="bg-primary/10 border-primary/40 pointer-events-none absolute inset-y-0 border-x"
                    style={{
                      left: range.first * colW,
                      width: (range.last - range.first + 1) * colW,
                    }}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
