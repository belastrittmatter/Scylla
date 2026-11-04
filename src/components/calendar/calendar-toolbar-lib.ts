import { addDays, endOfWeek, format, startOfWeek } from "date-fns";
import type { CalendarView } from "@/components/reui/event-calendar/event-calendar-types";

function formatRange(start: Date, end: Date): string {
  if (start.getFullYear() !== end.getFullYear()) {
    return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  }
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

/** Human label for the visible period of the calendar toolbar. */
export function getRangeLabel(
  view: CalendarView,
  date: Date,
  weekStartsOn: 0 | 1,
): string {
  if (view === "month") return format(date, "MMMM yyyy");

  if (view === "week") {
    return formatRange(
      startOfWeek(date, { weekStartsOn }),
      endOfWeek(date, { weekStartsOn }),
    );
  }

  if (view === "days") return formatRange(date, addDays(date, 3));
  if (view === "agenda") return formatRange(date, addDays(date, 29));

  return format(date, "EEEE, MMMM d, yyyy");
}
