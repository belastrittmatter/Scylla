import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay as dateFnsIsSameDay,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
  differenceInMinutes,
} from "date-fns";

export { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths };

export const CALENDAR_START_HOUR = 9; // 9 AM
export const CALENDAR_END_HOUR = 17; // 5 PM (displays 9 AM to 4 PM intervals)
export const CALENDAR_ROW_HEIGHT = 80; // 80px per hour

export function getWeekDays(referenceDate: Date): Date[] {
  // ISO week starts on Monday
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthMatrix(referenceDate: Date): Date[][] {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  return weeks;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return dateFnsIsSameDay(d1, d2);
}

export function formatEventTime(isoString: string): string {
  try {
    const d = parseISO(isoString);
    return format(d, "h:mm a");
  } catch {
    return "";
  }
}

export function calculateEventPosition(
  startIso: string,
  endIso: string,
  startHour = CALENDAR_START_HOUR,
  rowHeight = CALENDAR_ROW_HEIGHT
) {
  const start = parseISO(startIso);
  const end = parseISO(endIso);

  const startHourFloat = start.getHours() + start.getMinutes() / 60;
  const offsetFromStartHour = Math.max(0, startHourFloat - startHour);
  const durationMinutes = Math.max(25, differenceInMinutes(end, start));

  const top = offsetFromStartHour * rowHeight;
  const height = (durationMinutes / 60) * rowHeight;

  return { top, height };
}

export function calculateCurrentTimeTop(
  targetDate: Date,
  startHour = CALENDAR_START_HOUR,
  rowHeight = CALENDAR_ROW_HEIGHT
) {
  const currentHourFloat = targetDate.getHours() + targetDate.getMinutes() / 60;
  const offset = currentHourFloat - startHour;
  return Math.max(0, offset * rowHeight);
}
