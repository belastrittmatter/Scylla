import type {
  CalendarSettings,
  CalendarViewPreference,
} from "@/hooks/use-calendar-settings";

export const CALENDAR_VIEWS: {
  id: CalendarViewPreference;
  title: string;
}[] = [
  { id: "week", title: "Week" },
  { id: "month", title: "Month" },
  { id: "day", title: "Day" },
  { id: "agenda", title: "Agenda" },
];

export const START_HOURS = [6, 7, 8, 9, 10] as const;

export const END_HOURS = [17, 18, 19, 20, 21] as const;

/** One source for slot labels: `label` reads in prose, `short` sits in the control. */
export const SLOT_DURATIONS: {
  value: CalendarSettings["slotDuration"];
  label: string;
  short: string;
}[] = [
  { value: 15, label: "15 minutes", short: "15m" },
  { value: 30, label: "30 minutes", short: "30m" },
  { value: 60, label: "60 minutes", short: "60m" },
];

/** Formats a whole hour in the user's own time format: "8:00 AM" or "08:00". */
export function formatHourLabel(
  hour: number,
  timeFormat: CalendarSettings["timeFormat"],
): string {
  if (timeFormat === "24h") {
    return `${String(hour).padStart(2, "0")}:00`;
  }
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 || hour === 24 ? "AM" : "PM";
  return `${displayHour}:00 ${suffix}`;
}
