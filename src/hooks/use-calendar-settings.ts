"use client";

import * as React from "react";
import { z } from "zod";

export const calendarSettingsSchema = z
  .object({
    defaultView: z.enum(["week", "month", "day", "agenda"]),
    weekStartsOn: z.union([z.literal(0), z.literal(1)]),
    dayStartHour: z.number().int().min(0).max(23),
    dayEndHour: z.number().int().min(1).max(24),
    showWeekends: z.boolean(),
    timeFormat: z.enum(["12h", "24h"]),
    slotDuration: z.union([z.literal(15), z.literal(30), z.literal(60)]),
    showNowIndicator: z.boolean(),
  })
  .refine((data) => data.dayStartHour < data.dayEndHour, {
    message: "Start hour must be before end hour",
    path: ["dayStartHour"],
  });

export const workingHoursSchema = z
  .object({
    dayStartHour: z.number().int().min(0).max(23),
    dayEndHour: z.number().int().min(1).max(24),
  })
  .refine((data) => data.dayStartHour < data.dayEndHour, {
    message: "Start hour must be before end hour",
    path: ["dayStartHour"],
  });

export type CalendarViewPreference = z.infer<
  typeof calendarSettingsSchema
>["defaultView"];
export type CalendarSettings = z.infer<typeof calendarSettingsSchema>;

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  defaultView: "week",
  weekStartsOn: 1, // Monday
  dayStartHour: 8,
  dayEndHour: 18,
  showWeekends: true,
  timeFormat: "12h",
  slotDuration: 30,
  showNowIndicator: true,
};

const STORAGE_KEY = "scylla_calendar_settings";
const CHANGE_EVENT = "scylla_calendar_settings_change";

let cachedRaw: string | null = null;
let cachedSettings: CalendarSettings = DEFAULT_CALENDAR_SETTINGS;

function readStoredSettings(): CalendarSettings {
  if (typeof window === "undefined") {
    return DEFAULT_CALENDAR_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CALENDAR_SETTINGS;
    if (raw === cachedRaw) return cachedSettings;
    const parsed = JSON.parse(raw);
    const validated = calendarSettingsSchema.safeParse({
      ...DEFAULT_CALENDAR_SETTINGS,
      ...parsed,
    });
    if (!validated.success) {
      cachedRaw = raw;
      cachedSettings = DEFAULT_CALENDAR_SETTINGS;
      return cachedSettings;
    }
    cachedRaw = raw;
    cachedSettings = validated.data;
    return cachedSettings;
  } catch {
    cachedRaw = null;
    cachedSettings = DEFAULT_CALENDAR_SETTINGS;
    return cachedSettings;
  }
}

function writeStoredSettings(settings: CalendarSettings) {
  if (typeof window === "undefined") return;
  const validated = calendarSettingsSchema.safeParse(settings);
  if (!validated.success) {
    console.error("Invalid calendar settings:", validated.error);
    return;
  }
  try {
    const raw = JSON.stringify(validated.data);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedSettings = validated.data;
    window.dispatchEvent(
      new CustomEvent(CHANGE_EVENT, { detail: validated.data }),
    );
  } catch (err) {
    console.error("Failed to save calendar settings:", err);
  }
}

function subscribeCalendarSettings(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleEvent = () => callback();
  window.addEventListener(CHANGE_EVENT, handleEvent);
  window.addEventListener("storage", handleEvent);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleEvent);
    window.removeEventListener("storage", handleEvent);
  };
}

const emptySubscribe = () => () => {};

export function useCalendarSettings() {
  const isLoaded = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const settings = React.useSyncExternalStore(
    subscribeCalendarSettings,
    readStoredSettings,
    () => DEFAULT_CALENDAR_SETTINGS,
  );

  const updateSetting = React.useCallback(
    <K extends keyof CalendarSettings>(key: K, value: CalendarSettings[K]) => {
      const current = readStoredSettings();
      const next = { ...current, [key]: value };
      writeStoredSettings(next);
    },
    [],
  );

  const updateSettings = React.useCallback(
    (patch: Partial<CalendarSettings>) => {
      const current = readStoredSettings();
      const next = { ...current, ...patch };
      writeStoredSettings(next);
    },
    [],
  );

  const resetToDefaults = React.useCallback(() => {
    writeStoredSettings(DEFAULT_CALENDAR_SETTINGS);
  }, []);

  return {
    settings,
    isLoaded,
    updateSetting,
    updateSettings,
    resetToDefaults,
  };
}
