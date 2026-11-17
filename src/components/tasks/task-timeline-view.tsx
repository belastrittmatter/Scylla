"use client";

import * as React from "react";
import {
  addDays,
  differenceInCalendarDays,
  startOfWeek,
} from "date-fns";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { getOpeningDay, getVisibleDays } from "./task-timeline";
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
  const [visible, setVisible] = React.useState<{
    first: number;
    last: number;
  } | null>(null);
  const scroller = React.useRef<HTMLDivElement>(null);
  const anchor = React.useRef<number | null>(null); // day index to keep left on zoom
  // Until the user scrolls, re-fit the opening position when the pane resizes
  // (the resizable panel settles its width after the first layout).
  const touched = React.useRef(false);
  const [start] = React.useState(() =>
    startOfWeek(addDays(new Date(), -56), { weekStartsOn: 1 }),
  );
  const [today] = React.useState(() => new Date());
  const todayIdx = differenceInCalendarDays(today, start);

  // Scroll only updates `visible`; the grid and rows below are memoized on data and zoom.
  const dayList = React.useMemo(
    () => Array.from({ length: DAYS }, (_, i) => addDays(start, i)),
    [start],
  );
  const gridStyle = React.useMemo(
    () => ({ gridTemplateColumns: `repeat(${DAYS}, ${colW}px)`, width: DAYS * colW }),
    [colW],
  );
  const groups = React.useMemo(
    () => buildGroups(tasks, start, getContextLabel),
    [tasks, start, getContextLabel],
  );
  const unscheduled = React.useMemo(
    () => tasks.filter((t) => !t.dueDate && t.status !== "done"),
    [tasks],
  );
  const overdueCols = React.useMemo(
    () =>
      tasks.flatMap((t) => {
        if (!t.dueDate || t.status === "done" || t.status === "cancelled") {
          return [];
        }
        const col = differenceInCalendarDays(new Date(t.dueDate), start);
        return col >= 0 && col < todayIdx ? [col] : [];
      }),
    [tasks, start, todayIdx],
  );
  const { range, handlers } = useTimelineDragCreate({
    colW,
    days: DAYS,
    rangeStart: start,
    onCreateRange,
  });

  const updateVisible = React.useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const next = getVisibleDays(el.scrollLeft, el.clientWidth, colW, DAYS);
    setVisible((prev) =>
      prev?.first === next.first && prev?.last === next.last ? prev : next,
    );
  }, [colW]);

  const openingLeft = React.useCallback(
    (el: HTMLDivElement) =>
      getOpeningDay({
        todayIdx,
        visibleCols: Math.max(1, Math.floor(el.clientWidth / colW)),
        overdueCols,
        days: DAYS,
      }) * colW,
    [colW, todayIdx, overdueCols],
  );

  // Mount: open on today with overdue work in view; zoom: keep the same first visible day.
  React.useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollLeft =
      anchor.current !== null ? anchor.current * colW : openingLeft(el);
    updateVisible();
    const ro = new ResizeObserver(() => {
      if (!touched.current && anchor.current === null) {
        el.scrollLeft = openingLeft(el);
      }
      updateVisible();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [colW, openingLeft, updateVisible]);

  const markTouched = () => {
    touched.current = true;
  };
  const scrollByWeek = (dir: 1 | -1) => {
    markTouched();
    scroller.current?.scrollBy({ left: dir * 7 * colW, behavior: "smooth" });
  };
  const scrollToToday = () => {
    const el = scroller.current;
    if (!el) return;
    markTouched();
    el.scrollTo({ left: openingLeft(el), behavior: "smooth" });
  };
  const zoom = (next: number) => {
    anchor.current = Math.floor((scroller.current?.scrollLeft ?? 0) / colW);
    setColW(next);
  };

  const namePane = React.useMemo(
    () => (
      <TaskTimelineNamePane
        groups={groups}
        unscheduled={unscheduled}
        onSelect={onSelectTask}
      />
    ),
    [groups, unscheduled, onSelectTask],
  );
  const gridBody = React.useMemo(
    () => (
      <>
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
            {name && <div className={cn(BAND, "relative")} aria-hidden />}
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
      </>
    ),
    [dayList, today, gridStyle, colW, groups, onSelectTask],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TaskTimelineToolbar
        from={visible ? addDays(start, visible.first) : null}
        to={visible ? addDays(start, visible.last) : null}
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
            {namePane}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>
            <div
              ref={scroller}
              onScroll={updateVisible}
              onPointerDown={markTouched}
              onWheel={markTouched}
              onTouchStart={markTouched}
              onKeyDown={markTouched}
              className="h-full overflow-x-auto"
            >
              <div
                className="relative min-h-full select-none"
                style={{ width: DAYS * colW }}
                {...handlers}
              >
                {gridBody}
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
