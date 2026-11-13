import { afterEach, describe, expect, test } from "bun:test";
import {
  buildTaskSavePayload,
  createDraftTask,
  getTaskDateRangeError,
  inputToStartDate,
  startDateToInput,
} from "../../src/components/tasks/task-utils";
import type { TaskItem } from "../../src/components/tasks/task-types";

// Assigning `undefined` to process.env stores the string "undefined", which leaks a bogus TZ into later test files.
function restoreTz(tz: string | undefined): void {
  if (tz === undefined) delete process.env.TZ;
  else process.env.TZ = tz;
}

const RANGE_ERROR = "Start date must be on or before the due date";

function makeTask(overrides: Record<string, unknown>): TaskItem {
  return {
    ...createDraftTask("todo", "t1", "u1", null),
    id: "task-123",
    title: "Write the report",
    ...overrides,
  } as unknown as TaskItem;
}

describe("createDraftTask dates", () => {
  test("without dates the draft has startDate null and dueDate null", () => {
    const draft = createDraftTask("todo", "t1", "u1", null);
    expect(draft.startDate).toBeNull();
    expect(draft.dueDate).toBeNull();
  });

  test("with dates the draft uses the given startDate and dueDate", () => {
    const start = new Date(2026, 10, 10, 9, 0, 0);
    const due = new Date(2026, 10, 12, 18, 0, 0);
    const draft = createDraftTask("todo", "t1", "u1", null, null, {
      startDate: start,
      dueDate: due,
    });
    expect(draft.startDate).toBeInstanceOf(Date);
    expect(draft.dueDate).toBeInstanceOf(Date);
    expect(new Date(draft.startDate as Date).getTime()).toBe(start.getTime());
    expect(new Date(draft.dueDate as Date).getTime()).toBe(due.getTime());
    expect(draft.status).toBe("todo");
    expect(draft.teamId).toBe("t1");
    expect(draft.creatorId).toBe("u1");
    expect(draft.id.startsWith("draft-")).toBe(true);
  });

  test("with dates holding nulls the draft keeps both null", () => {
    const draft = createDraftTask("in_review", "t2", "u2", null, null, {
      startDate: null,
      dueDate: null,
    });
    expect(draft.startDate).toBeNull();
    expect(draft.dueDate).toBeNull();
    expect(draft.status).toBe("in_review");
  });

  test("with dates and only a startDate, dueDate stays null", () => {
    const start = new Date(2026, 10, 10, 9, 0, 0);
    const draft = createDraftTask("todo", "t1", "u1", null, null, {
      startDate: start,
      dueDate: null,
    });
    expect(new Date(draft.startDate as Date).getTime()).toBe(start.getTime());
    expect(draft.dueDate).toBeNull();
  });
});

describe("inputToStartDate / startDateToInput", () => {
  const originalTz = process.env.TZ;
  afterEach(() => restoreTz(originalTz));

  test("inputToStartDate maps yyyy-MM-dd to that local day at 09:00", () => {
    for (const tz of [
      "Asia/Bangkok",
      "Pacific/Auckland",
      "America/Los_Angeles",
    ]) {
      process.env.TZ = tz;
      const d = inputToStartDate("2026-11-10");
      expect(d).toBeInstanceOf(Date);
      expect(d!.getFullYear()).toBe(2026);
      expect(d!.getMonth()).toBe(10);
      expect(d!.getDate()).toBe(10);
      expect(d!.getHours()).toBe(9);
      expect(d!.getMinutes()).toBe(0);
    }
  });

  test("inputToStartDate maps an empty string to null", () => {
    expect(inputToStartDate("")).toBeNull();
  });

  test("startDateToInput formats a Date as local yyyy-MM-dd", () => {
    expect(startDateToInput(new Date(2026, 10, 10, 9))).toBe("2026-11-10");
  });

  test("startDateToInput returns an empty string for null and undefined", () => {
    expect(startDateToInput(null)).toBe("");
    expect(startDateToInput(undefined)).toBe("");
  });

  test("startDateToInput formats an ISO string as the local day", () => {
    process.env.TZ = "Asia/Bangkok"; // UTC+7: 20:00Z is 03:00 the next day
    expect(startDateToInput("2026-11-10T20:00:00.000Z")).toBe("2026-11-11");
    process.env.TZ = "America/Los_Angeles"; // UTC-8: 02:00Z is the previous evening
    expect(startDateToInput("2026-11-10T02:00:00.000Z")).toBe("2026-11-09");
  });

  test("round trip keeps the same day in any timezone", () => {
    for (const tz of [
      "Asia/Bangkok",
      "Pacific/Auckland",
      "America/Los_Angeles",
    ]) {
      process.env.TZ = tz;
      expect(startDateToInput(inputToStartDate("2026-11-10"))).toBe(
        "2026-11-10",
      );
    }
  });
});

describe("getTaskDateRangeError", () => {
  test("start day after due day returns the range error", () => {
    const err = getTaskDateRangeError("2026-11-12", "2026-11-10");
    expect(err).not.toBeNull();
    expect(err).toContain("Start date");
    expect(err).toBe(RANGE_ERROR);
  });

  test("start day after due day across a month boundary returns the error", () => {
    expect(getTaskDateRangeError("2026-12-01", "2026-11-30")).toBe(RANGE_ERROR);
  });

  test("equal days return null", () => {
    expect(getTaskDateRangeError("2026-11-10", "2026-11-10")).toBeNull();
  });

  test("start before due returns null", () => {
    expect(getTaskDateRangeError("2026-11-09", "2026-11-10")).toBeNull();
    expect(getTaskDateRangeError("2026-10-31", "2026-11-01")).toBeNull();
  });

  test("either value empty returns null", () => {
    expect(getTaskDateRangeError("", "2026-11-10")).toBeNull();
    expect(getTaskDateRangeError("2026-11-12", "")).toBeNull();
    expect(getTaskDateRangeError("", "")).toBeNull();
  });
});

describe("buildTaskSavePayload", () => {
  test("serialises startDate to ISO, keeps null dueDate and defaults estimatedMinutes to 60", () => {
    const payload = buildTaskSavePayload(
      makeTask({
        startDate: new Date("2026-11-10T02:00:00.000Z"),
        dueDate: null,
        estimatedMinutes: null,
      }),
    );
    expect(payload.startDate).toBe("2026-11-10T02:00:00.000Z");
    expect(payload.dueDate).toBeNull();
    expect(payload.estimatedMinutes).toBe(60);
  });

  test("null startDate stays null", () => {
    const payload = buildTaskSavePayload(
      makeTask({
        startDate: null,
        dueDate: new Date("2026-11-12T11:00:00.000Z"),
      }),
    );
    expect(payload.startDate).toBeNull();
    expect(payload.dueDate).toBe("2026-11-12T11:00:00.000Z");
  });

  test("a string startDate is converted to an ISO string", () => {
    const payload = buildTaskSavePayload(
      makeTask({
        startDate: "2026-11-10T02:00:00Z",
        dueDate: "2026-11-12T11:00:00Z",
      }),
    );
    expect(payload.startDate).toBe("2026-11-10T02:00:00.000Z");
    expect(payload.dueDate).toBe("2026-11-12T11:00:00.000Z");
  });

  test("keeps a set estimatedMinutes and preserves other fields", () => {
    const payload = buildTaskSavePayload(
      makeTask({
        startDate: new Date("2026-11-10T02:00:00.000Z"),
        dueDate: null,
        estimatedMinutes: 90,
      }),
    );
    expect(payload.estimatedMinutes).toBe(90);
    expect(payload.id).toBe("task-123");
    expect(payload.title).toBe("Write the report");
    expect(payload.teamId).toBe("t1");
    expect(payload.status).toBe("todo");
  });
});
