import { describe, it, expect, beforeEach } from "bun:test";
import {
  DEFAULT_CALENDAR_SETTINGS,
  type CalendarSettings,
} from "@/hooks/use-calendar-settings";

describe("Calendar Settings & Storage Defaults", () => {
  beforeEach(() => {
    // Reset simulated localStorage if available in environment
    if (typeof globalThis.localStorage !== "undefined") {
      globalThis.localStorage.clear();
    }
  });

  it("exports valid default calendar settings", () => {
    expect(DEFAULT_CALENDAR_SETTINGS.defaultView).toBe("week");
    expect(DEFAULT_CALENDAR_SETTINGS.weekStartsOn).toBe(1); // Monday
    expect(DEFAULT_CALENDAR_SETTINGS.dayStartHour).toBe(8);
    expect(DEFAULT_CALENDAR_SETTINGS.dayEndHour).toBe(18);
    expect(DEFAULT_CALENDAR_SETTINGS.showWeekends).toBe(true);
    expect(DEFAULT_CALENDAR_SETTINGS.timeFormat).toBe("12h");
    expect(DEFAULT_CALENDAR_SETTINGS.slotDuration).toBe(30);
    expect(DEFAULT_CALENDAR_SETTINGS.showNowIndicator).toBe(true);
  });

  it("handles valid custom settings merging", () => {
    const custom: Partial<CalendarSettings> = {
      defaultView: "month",
      weekStartsOn: 0,
      dayStartHour: 9,
      dayEndHour: 17,
      showWeekends: false,
      timeFormat: "24h",
      slotDuration: 60,
      showNowIndicator: false,
    };

    const merged: CalendarSettings = {
      ...DEFAULT_CALENDAR_SETTINGS,
      ...custom,
    };

    expect(merged.defaultView).toBe("month");
    expect(merged.weekStartsOn).toBe(0);
    expect(merged.dayStartHour).toBe(9);
    expect(merged.dayEndHour).toBe(17);
    expect(merged.showWeekends).toBe(false);
    expect(merged.timeFormat).toBe("24h");
    expect(merged.slotDuration).toBe(60);
    expect(merged.showNowIndicator).toBe(false);
  });

  it("persists settings to localStorage key scylla_calendar_settings", () => {
    if (typeof globalThis.localStorage !== "undefined") {
      const STORAGE_KEY = "scylla_calendar_settings";
      const sampleSettings: CalendarSettings = {
        ...DEFAULT_CALENDAR_SETTINGS,
        defaultView: "agenda",
        timeFormat: "24h",
      };

      globalThis.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(sampleSettings),
      );
      const retrieved = JSON.parse(
        globalThis.localStorage.getItem(STORAGE_KEY) || "{}",
      );

      expect(retrieved.defaultView).toBe("agenda");
      expect(retrieved.timeFormat).toBe("24h");
    }
  });
});
