import { describe, expect, test } from "bun:test";
import { differenceInCalendarDays } from "date-fns";
import {
  getDayIndexAtX,
  getDragCreateDates,
  getDragDayRange,
  getTimelineSpan,
} from "../../src/components/tasks/task-timeline";
import { buildGroups } from "../../src/components/tasks/task-timeline-groups";
import type { TaskItem } from "../../src/components/tasks/task-types";

// Monday 2026-11-09, local time.
const start = new Date(2026, 10, 9);
const at = (day: number, hour = 12) => new Date(2026, 10, day, hour);

describe("getTimelineSpan with startDate", () => {
  test("starts the bar at startDate instead of createdAt", () => {
    expect(
      getTimelineSpan(
        { createdAt: at(1), startDate: at(11), dueDate: at(13) },
        start,
        14,
      ),
    ).toEqual({ startCol: 2, span: 3, clipped: false });
  });

  test("falls back to createdAt when startDate is null or omitted", () => {
    expect(
      getTimelineSpan(
        { createdAt: at(10), startDate: null, dueDate: at(12) },
        start,
        14,
      ),
    ).toEqual({ startCol: 1, span: 3, clipped: false });
    expect(
      getTimelineSpan({ createdAt: at(10), dueDate: at(12) }, start, 14),
    ).toEqual({ startCol: 1, span: 3, clipped: false });
  });

  test("clamps a startDate before the range and flags it clipped", () => {
    expect(
      getTimelineSpan(
        { createdAt: at(10), startDate: at(1), dueDate: at(10) },
        start,
        14,
      ),
    ).toEqual({ startCol: 0, span: 2, clipped: true });
  });

  test("a startDate after the due date occupies only the due day", () => {
    expect(
      getTimelineSpan(
        { createdAt: at(1), startDate: at(15), dueDate: at(11, 0) },
        start,
        14,
      ),
    ).toEqual({ startCol: 2, span: 1, clipped: false });
  });

  test("uses the startDate's local calendar day regardless of time", () => {
    expect(
      getTimelineSpan(
        { createdAt: at(9), startDate: at(12, 23), dueDate: at(13, 0) },
        start,
        14,
      ),
    ).toEqual({ startCol: 3, span: 2, clipped: false });
  });

  test("accepts an ISO-string startDate", () => {
    expect(
      getTimelineSpan(
        {
          createdAt: at(1).toISOString(),
          startDate: at(11).toISOString(),
          dueDate: at(13).toISOString(),
        },
        start,
        14,
      ),
    ).toEqual({ startCol: 2, span: 3, clipped: false });
  });

  test("null without a due date even when startDate is set", () => {
    expect(
      getTimelineSpan(
        { createdAt: at(10), startDate: at(11), dueDate: null },
        start,
        14,
      ),
    ).toBeNull();
  });
});

describe("buildGroups passes startDate through", () => {
  const task = (startDate: Date | null): TaskItem =>
    ({
      id: "t1",
      title: "Timeline task",
      status: "todo",
      createdAt: at(10),
      startDate,
      dueDate: at(25),
    }) as unknown as TaskItem;

  const rowsFor = (t: TaskItem) =>
    [...buildGroups([t], start).values()].flat().filter((r) => r.task === t);

  test("the row's bar starts at the task's startDate", () => {
    const t = task(at(20));
    const rows = rowsFor(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].span?.startCol).toBe(
      differenceInCalendarDays(at(20), start),
    );
    expect(rows[0].span?.startCol).toBe(11);
  });

  test("the row's bar starts at createdAt when startDate is null", () => {
    const t = task(null);
    const rows = rowsFor(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].span?.startCol).toBe(
      differenceInCalendarDays(at(10), start),
    );
  });
});

describe("getDayIndexAtX", () => {
  test("floors x by the column width", () => {
    expect(getDayIndexAtX(0, 36, 140)).toBe(0);
    expect(getDayIndexAtX(35.9, 36, 140)).toBe(0);
    expect(getDayIndexAtX(36, 36, 140)).toBe(1);
    expect(getDayIndexAtX(36 * 3 + 10, 36, 140)).toBe(3);
  });

  test("clamps to [0, days - 1]", () => {
    expect(getDayIndexAtX(-10, 36, 140)).toBe(0);
    expect(getDayIndexAtX(36 * 500, 36, 140)).toBe(139);
    expect(getDayIndexAtX(36 * 140, 36, 140)).toBe(139);
  });
});

describe("getDragDayRange", () => {
  test("returns min and max regardless of drag direction", () => {
    expect(getDragDayRange(5, 2)).toEqual({ first: 2, last: 5 });
    expect(getDragDayRange(2, 5)).toEqual({ first: 2, last: 5 });
  });

  test("a single column gives first === last", () => {
    expect(getDragDayRange(3, 3)).toEqual({ first: 3, last: 3 });
  });
});

describe("getDragCreateDates", () => {
  const expectLocal = (
    d: Date,
    y: number,
    m: number,
    day: number,
    hour: number,
  ) => {
    expect(d.getFullYear()).toBe(y);
    expect(d.getMonth()).toBe(m);
    expect(d.getDate()).toBe(day);
    expect(d.getHours()).toBe(hour);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  };

  test("start is the first day at 09:00, due is the last day at 18:00", () => {
    const { startDate, dueDate } = getDragCreateDates(start, 2, 4);
    expectLocal(startDate, 2026, 10, 11, 9);
    expectLocal(dueDate, 2026, 10, 13, 18);
  });

  test("a reversed drag normalised by getDragDayRange gives the same dates", () => {
    const { first, last } = getDragDayRange(4, 2);
    const { startDate, dueDate } = getDragCreateDates(start, first, last);
    expectLocal(startDate, 2026, 10, 11, 9);
    expectLocal(dueDate, 2026, 10, 13, 18);
  });

  test("crosses month boundaries by calendar day", () => {
    const { startDate, dueDate } = getDragCreateDates(start, 21, 23);
    expectLocal(startDate, 2026, 10, 30, 9);
    expectLocal(dueDate, 2026, 11, 2, 18);
  });
});
