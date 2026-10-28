"use client";

import * as React from "react";

export type CalendarViewPreference = "week" | "month" | "day" | "agenda";

export interface CalendarSettings {
  defaultView: CalendarViewPreference;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  dayStartHour: number; // 0 - 23 (e.g. 8 for 8:00 AM)
  dayEndHour: number; // 1 - 24 (e.g. 18 for 6:00 PM)
  showWeekends: boolean;
  timeFormat: "12h" | "24h";
  slotDuration: number; // 15, 30, 60 minutes
  showNowIndicator: boolean;
}

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
    cachedRaw = raw;
    cachedSettings = {
      ...DEFAULT_CALENDAR_SETTINGS,
      ...parsed,
    };
    return cachedSettings;
  } catch {
    return DEFAULT_CALENDAR_SETTINGS;
  }
}

function writeStoredSettings(settings: CalendarSettings) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedSettings = settings;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: settings }));
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
    () => false
  );

  const settings = React.useSyncExternalStore(
    subscribeCalendarSettings,
    readStoredSettings,
    () => DEFAULT_CALENDAR_SETTINGS
  );

  const updateSetting = React.useCallback(
    <K extends keyof CalendarSettings>(key: K, value: CalendarSettings[K]) => {
      const current = readStoredSettings();
      const next = { ...current, [key]: value };
      writeStoredSettings(next);
    },
    []
  );

  const updateSettings = React.useCallback((patch: Partial<CalendarSettings>) => {
    const current = readStoredSettings();
    const next = { ...current, ...patch };
    writeStoredSettings(next);
  }, []);

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
