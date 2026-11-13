import { addDays, differenceInCalendarDays } from "date-fns";
import type { TaskItem } from "./task-types";

type DateLike = Date | string;

export interface TimelineSpan {
  /** 0-based day column inside the range. */
  startCol: number;
  span: number;
  /** The real start lies before the range, so the bar is cut at the left edge. */
  clipped: boolean;
}

/**
 * Bar from `startDate` (or `createdAt` when no start date is set) to the end of
 * `dueDate`'s day, in local days, clamped to the range.
 */
export function getTimelineSpan(
  task: {
    createdAt: DateLike;
    dueDate: DateLike | null;
    startDate?: DateLike | null;
  },
  rangeStart: Date,
  days: number,
): TimelineSpan | null {
  if (!task.dueDate) return null;
  const end = differenceInCalendarDays(new Date(task.dueDate), rangeStart);
  const begin = differenceInCalendarDays(
    new Date(task.startDate || task.createdAt),
    rangeStart,
  );
  const realStart = Math.min(begin, end);
  const start = Math.max(0, realStart);
  const last = Math.min(days - 1, end);
  if (last < 0 || start >= days) return null;
  return { startCol: start, span: last - start + 1, clipped: realStart < 0 };
}

/** Slip of an open task due before the range: from the left edge through today (clipped). */
export function getOverdueSpan(
  task: { dueDate: DateLike | null; status: TaskItem["status"] },
  rangeStart: Date,
  days: number,
  now: Date = new Date(),
): Omit<TimelineSpan, "clipped"> | null {
  if (!task.dueDate || task.status === "done" || task.status === "cancelled") {
    return null;
  }
  if (differenceInCalendarDays(new Date(task.dueDate), rangeStart) >= 0) {
    return null;
  }
  // Not overdue yet (due today or later): nothing to show before the range.
  if (differenceInCalendarDays(new Date(task.dueDate), now) >= 0) return null;
  const today = differenceInCalendarDays(now, rangeStart);
  // Range in the future: still unfinished, so keep a one-day stub at the left edge.
  return { startCol: 0, span: today < 0 ? 1 : Math.min(days, today + 1) };
}

/** First and last (partially) visible day index of a horizontally scrolled day grid. */
export function getVisibleDays(
  scrollLeft: number,
  viewportWidth: number,
  colWidth: number,
  days: number,
): { first: number; last: number } {
  const first = Math.min(
    days - 1,
    Math.max(0, Math.floor(scrollLeft / colWidth)),
  );
  const last = Math.ceil((scrollLeft + viewportWidth) / colWidth) - 1;
  return { first, last: Math.min(days - 1, Math.max(first, last)) };
}

/** Day column under an x offset (px from the grid's left edge), clamped to the range. */
export function getDayIndexAtX(x: number, colW: number, days: number): number {
  return Math.min(days - 1, Math.max(0, Math.floor(x / colW)));
}

/** Covered day range of a drag between two day indices, in either direction. */
export function getDragDayRange(
  a: number,
  b: number,
): { first: number; last: number } {
  return { first: Math.min(a, b), last: Math.max(a, b) };
}

/** Draft dates for a drag-created task: first day 09:00 → last day 18:00, local time. */
export function getDragCreateDates(
  rangeStart: Date,
  first: number,
  last: number,
): { startDate: Date; dueDate: Date } {
  const startDate = new Date(addDays(rangeStart, first));
  startDate.setHours(9, 0, 0, 0);
  const dueDate = new Date(addDays(rangeStart, last));
  dueDate.setHours(18, 0, 0, 0);
  return { startDate, dueDate };
}
