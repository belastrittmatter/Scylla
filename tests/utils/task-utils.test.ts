import { afterEach, describe, expect, test } from "bun:test";
import {
  dueDateToInput,
  filterTasks,
  formatElapsedCompact,
  getQuietPriority,
  inputToDueDate,
  parseDbTimestampToIso,
  parseTimestampMs,
  restoreFailedTasks,
} from "../../src/components/tasks/task-utils";
import { INITIAL_TASK_FILTERS } from "../../src/components/tasks/task-types";
import type {
  DeadlineHorizon,
  TaskFilters,
  TaskItem,
} from "../../src/components/tasks/task-types";

// Assigning `undefined` to process.env stores the string "undefined", which leaks a bogus TZ into later test files.
function restoreTz(tz: string | undefined): void {
  if (tz === undefined) delete process.env.TZ;
  else process.env.TZ = tz;
}

describe("task-utils timestamp parsing", () => {
  test("parseDbTimestampToIso handles null, undefined, and empty", () => {
    expect(parseDbTimestampToIso(null)).toBeNull();
    expect(parseDbTimestampToIso(undefined)).toBeNull();
    expect(parseDbTimestampToIso("")).toBeNull();
    expect(parseDbTimestampToIso("   ")).toBeNull();
  });

  test("parseDbTimestampToIso treats unadorned DB timestamps as UTC regardless of local timezone", () => {
    const origTz = process.env.TZ;
    try {
      process.env.TZ = "Asia/Bangkok"; // UTC+7
      const rawPg = "2026-10-28 02:19:57.185";
      const iso = parseDbTimestampToIso(rawPg);
      expect(iso).toBe("2026-10-28T02:19:57.185Z");
      expect(new Date(iso!).getUTCHours()).toBe(2);

      const ms = parseTimestampMs(rawPg);
      expect(new Date(ms).toISOString()).toBe("2026-10-28T02:19:57.185Z");
    } finally {
      restoreTz(origTz);
    }
  });

  test("parseDbTimestampToIso handles Date objects and ISO strings with offsets", () => {
    const d = new Date("2026-10-28T12:00:00.000Z");
    expect(parseDbTimestampToIso(d)).toBe("2026-10-28T12:00:00.000Z");

    const withOffset = "2026-10-28 02:19:57.185+00";
    expect(parseDbTimestampToIso(withOffset)).toBe("2026-10-28T02:19:57.185Z");
  });

  test("parseTimestampMs handles null, undefined, empty, and numeric timestamps", () => {
    expect(parseTimestampMs(null)).toBe(0);
    expect(parseTimestampMs(undefined)).toBe(0);
    expect(parseTimestampMs("")).toBe(0);
    expect(parseTimestampMs(1700000000000)).toBe(1700000000000);
  });
});

describe("due date round-trip", () => {
  const originalTz = process.env.TZ;
  afterEach(() => restoreTz(originalTz));

  test("saving then re-reading a picked date keeps the same day in any timezone", () => {
    for (const tz of [
      "Asia/Bangkok",
      "Pacific/Auckland",
      "America/Los_Angeles",
    ]) {
      process.env.TZ = tz;
      expect(dueDateToInput(inputToDueDate("2026-03-10"))).toBe("2026-03-10");
    }
    expect(inputToDueDate("")).toBeNull();
  });
});

describe("filterTasks deadline horizon", () => {
  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(12, 0, 0, 0);
    return d;
  };
  const mk = (id: string, dueDate: Date | null, status = "todo") =>
    ({ id, title: id, dueDate, status, priority: "low" }) as TaskItem;
  const filters = (deadlineHorizon: DeadlineHorizon): TaskFilters => ({
    ...INITIAL_TASK_FILTERS,
    deadlineHorizon,
  });
  const tasks = [
    mk("late", day(-2)),
    mk("lateDone", day(-2), "done"),
    mk("today", day(0)),
    mk("soon", day(3)),
    mk("far", day(30)),
    mk("none", null),
  ];
  const ids = (h: DeadlineHorizon) =>
    filterTasks(tasks, filters(h)).map((t) => t.id);

  test("buckets agree with the grouped list; closed tasks are never overdue", () => {
    expect(ids("overdue")).toEqual(["late"]);
    expect(ids("today")).toEqual(["today"]);
    expect(ids("upcoming")).toEqual(["soon", "far"]);
    expect(ids("no_date")).toEqual(["none"]);
  });
});

const t = (id: string, title = id) => ({ id, title }) as TaskItem;

describe("restoreFailedTasks", () => {
  test("re-inserts only failed tasks at their original position", () => {
    const snapshot = [t("a"), t("b"), t("c"), t("d")];
    const current = [t("d")]; // a, b, c were optimistically removed
    const out = restoreFailedTasks(current, snapshot, new Set(["b"]));
    expect(out.map((x) => x.id)).toEqual(["b", "d"]);
  });

  test("keeps newer state of survivors and tasks added meanwhile", () => {
    const snapshot = [t("a"), t("b")];
    const current = [t("b", "edited"), t("new")];
    const out = restoreFailedTasks(current, snapshot, new Set(["a"]));
    expect(out.map((x) => x.title)).toEqual(["a", "edited", "new"]);
  });
});

describe("formatElapsedCompact / getQuietPriority", () => {
  test("formats two most significant units", () => {
    expect(formatElapsedCompact(0)).toBe("0m");
    expect(formatElapsedCompact(12 * 60 + 59)).toBe("12m");
    expect(formatElapsedCompact(3 * 3600 + 12 * 60)).toBe("3h 12m");
    expect(formatElapsedCompact(3 * 3600)).toBe("3h");
    expect(formatElapsedCompact(148 * 3600 + 8 * 60)).toBe("6d 4h");
  });
  test("shows priority only for open urgent/high", () => {
    expect(getQuietPriority("urgent", false)?.label).toBe("Urgent");
    expect(getQuietPriority("high", false)?.label).toBe("High");
    expect(getQuietPriority("medium", false)).toBeNull();
    expect(getQuietPriority("urgent", true)).toBeNull();
  });
});
