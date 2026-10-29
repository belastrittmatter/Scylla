import * as React from "react";
import { Columns3, LayoutGrid, CalendarCheck, ListTodo } from "lucide-react";
import type { CalendarViewPreference } from "@/hooks/use-calendar-settings";

export const CALENDAR_VIEWS: {
  id: CalendarViewPreference;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "week",
    title: "Week View",
    description:
      "7-day or 5-day dense multi-column grid with hourly time tracks",
    icon: Columns3,
  },
  {
    id: "month",
    title: "Month View",
    description:
      "Full monthly 35/42-cell matrix displaying all recurring & single events",
    icon: LayoutGrid,
  },
  {
    id: "day",
    title: "Day View",
    description:
      "Detailed single-day focus view with precise minutes and mutual slot finder",
    icon: CalendarCheck,
  },
  {
    id: "agenda",
    title: "Agenda View",
    description:
      "Linear chronological stream of upcoming meetings & booked physical rooms",
    icon: ListTodo,
  },
];

export const START_HOURS = [
  { value: 6, label: "06:00 AM" },
  { value: 7, label: "07:00 AM" },
  { value: 8, label: "08:00 AM (Standard)" },
  { value: 9, label: "09:00 AM" },
  { value: 10, label: "10:00 AM" },
];

export const END_HOURS = [
  { value: 17, label: "05:00 PM (17:00)" },
  { value: 18, label: "06:00 PM (18:00 Standard)" },
  { value: 19, label: "07:00 PM (19:00)" },
  { value: 20, label: "08:00 PM (20:00)" },
  { value: 21, label: "09:00 PM (21:00)" },
];

export const SLOT_DURATIONS: {
  value: 15 | 30 | 60;
  label: string;
  sub: string;
}[] = [
  { value: 15, label: "15 Minutes", sub: "Fine-grained / high density" },
  { value: 30, label: "30 Minutes", sub: "Standard default meetings" },
  { value: 60, label: "60 Minutes", sub: "Coarse 1-hour block slots" },
];
