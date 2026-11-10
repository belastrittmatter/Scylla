import { describe, expect, test } from "bun:test";
import {
  getOverdueSpan,
  getTimelineSpan,
  getVisibleDays,
} from "../../src/components/tasks/task-timeline";
import type { TaskStatus } from "../../src/components/tasks/task-types";

// Monday 2026-11-09, local time.
const start = new Date(2026, 10, 9);
const at = (day: number, hour = 12) => new Date(2026, 10, day, hour);

describe("getTimelineSpan", () => {
  test("spans from created day to the end of the due day", () => {
    expect(
      getTimelineSpan({ createdAt: at(10), dueDate: at(12) }, start, 14),
    ).toEqual({ startCol: 1, span: 3, clipped: false });
  });

  test("clamps a start before the range to the first column and flags it", () => {
    expect(
      getTimelineSpan({ createdAt: at(1), dueDate: at(10, 23) }, start, 14),
    ).toEqual({ startCol: 0, span: 2, clipped: true });
  });

  test("clamps an end after the range to the last column", () => {
    expect(
      getTimelineSpan({ createdAt: at(20), dueDate: at(30) }, start, 14),
    ).toEqual({ startCol: 11, span: 3, clipped: false });
  });

  test("a task created after its due date occupies the due day", () => {
    expect(
      getTimelineSpan({ createdAt: at(15), dueDate: at(11, 0) }, start, 14),
    ).toEqual({ startCol: 2, span: 1, clipped: false });
  });

  test("null without a due date or fully outside the range", () => {
    expect(
      getTimelineSpan({ createdAt: at(10), dueDate: null }, start, 14),
    ).toBeNull();
    expect(
      getTimelineSpan({ createdAt: at(1), dueDate: at(8, 23) }, start, 14),
    ).toBeNull();
    expect(
      getTimelineSpan({ createdAt: at(23), dueDate: at(25) }, start, 14),
    ).toBeNull();
  });

  test("accepts ISO strings (serialised payloads)", () => {
    expect(
      getTimelineSpan(
        { createdAt: at(9, 0).toISOString(), dueDate: at(9, 0).toISOString() },
        start,
        14,
      ),
    ).toEqual({ startCol: 0, span: 1, clipped: false });
  });
});

describe("getOverdueSpan", () => {
  const task = (dueDate: Date | null, status: TaskStatus = "todo") => ({
    dueDate,
    status,
  });

  test("open task due before the range: left edge up to today", () => {
    expect(getOverdueSpan(task(at(5)), start, 14, at(11))).toEqual({
      startCol: 0,
      span: 3,
    });
  });

  test("clips at the range end when today is past it", () => {
    expect(getOverdueSpan(task(at(5)), start, 14, at(30))).toEqual({
      startCol: 0,
      span: 14,
    });
  });

  test("null when closed, undated, due inside the range, or today precedes the range", () => {
    expect(getOverdueSpan(task(at(5), "done"), start, 14, at(11))).toBeNull();
    expect(
      getOverdueSpan(task(at(5), "cancelled"), start, 14, at(11)),
    ).toBeNull();
    expect(getOverdueSpan(task(null), start, 14, at(11))).toBeNull();
    expect(getOverdueSpan(task(at(9, 0)), start, 14, at(11))).toBeNull();
    expect(getOverdueSpan(task(at(5)), start, 14, at(7))).toEqual({
      startCol: 0,
      span: 1,
    });
    expect(getOverdueSpan(task(at(8)), start, 14, at(3))).toBeNull();
  });
});

describe("getVisibleDays", () => {
  test("covers partially visible columns at both edges", () => {
    expect(getVisibleDays(90, 200, 36, 140)).toEqual({ first: 2, last: 8 });
    expect(getVisibleDays(0, 72, 36, 140)).toEqual({ first: 0, last: 1 });
  });

  test("clamps to the window", () => {
    expect(getVisibleDays(-50, 100, 36, 140)).toEqual({ first: 0, last: 1 });
    expect(getVisibleDays(5000, 400, 36, 140)).toEqual({
      first: 138,
      last: 139,
    });
  });
});
