import { describe, expect, test } from "bun:test";
import { getRangeLabel } from "@/components/calendar/calendar-toolbar-lib";

// Wednesday, November 4, 2026
const WED = new Date(2026, 10, 4, 12, 0, 0);

describe("getRangeLabel", () => {
  test("week inside one month", () => {
    expect(getRangeLabel("week", WED, 1)).toBe("Nov 2 – 8, 2026");
  });

  test("week across a month boundary", () => {
    expect(getRangeLabel("week", new Date(2026, 10, 30), 1)).toBe(
      "Nov 30 – Dec 6, 2026",
    );
  });

  test("week across a year boundary", () => {
    expect(getRangeLabel("week", new Date(2026, 11, 31), 1)).toBe(
      "Dec 28, 2026 – Jan 3, 2027",
    );
  });

  test("month", () => {
    expect(getRangeLabel("month", WED, 1)).toBe("November 2026");
  });

  test("day", () => {
    expect(getRangeLabel("day", WED, 1)).toBe("Wednesday, November 4, 2026");
  });

  test("agenda spans thirty days", () => {
    expect(getRangeLabel("agenda", WED, 1)).toBe("Nov 4 – Dec 3, 2026");
  });
});
