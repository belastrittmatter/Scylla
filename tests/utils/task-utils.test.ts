import { describe, expect, test } from "bun:test";
import { parseDbTimestampToIso, parseTimestampMs } from "../../src/components/tasks/task-utils";

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
      process.env.TZ = origTz;
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
