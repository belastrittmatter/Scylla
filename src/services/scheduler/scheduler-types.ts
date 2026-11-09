export interface FindSlotsParams {
  attendees: string[]; // Email addresses or user IDs
  durationMinutes: number;
  startDate: Date | string;
  endDate: Date | string;
  eventTypeId?: string;
  roomId?: string;
  beforeBuffer?: number;
  afterBuffer?: number;
  timeZone?: string;
  accessToken?: string;
  prefetchedBusy?: Array<{ start: string | number; end: string | number }>;
}

export interface TimeSlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  available: boolean;
}

export interface WorkingHoursEntry {
  day: number;
  start: string;
  end: string;
}

export const DEFAULT_WORKING_HOURS: WorkingHoursEntry[] = [
  { day: 1, start: "08:00", end: "18:00" }, // Mon
  { day: 2, start: "08:00", end: "18:00" }, // Tue
  { day: 3, start: "08:00", end: "18:00" }, // Wed
  { day: 4, start: "08:00", end: "18:00" }, // Thu
  { day: 5, start: "08:00", end: "18:00" }, // Fri
];

export function getZonedParts(
  date: Date,
  timeZone?: string,
): { day: number; minutes: number } {
  if (!timeZone) {
    return {
      day: date.getDay(),
      minutes: date.getHours() * 60 + date.getMinutes(),
    };
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    });

    const parts = formatter.formatToParts(date);
    let weekdayStr = "";
    let hour = 0;
    let minute = 0;

    for (const p of parts) {
      if (p.type === "weekday") weekdayStr = p.value;
      if (p.type === "hour") hour = parseInt(p.value, 10);
      if (p.type === "minute") minute = parseInt(p.value, 10);
    }

    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const day = weekdayMap[weekdayStr] ?? date.getDay();
    if (hour === 24) hour = 0;
    return { day, minutes: hour * 60 + minute };
  } catch {
    return {
      day: date.getDay(),
      minutes: date.getHours() * 60 + date.getMinutes(),
    };
  }
}

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
