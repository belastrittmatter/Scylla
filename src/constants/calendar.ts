export type CalendarViewType = "month" | "week" | "day";
export type CalendarTabType = "all" | "shared" | "public" | "archived";
export type EventColor =
  "gray" | "blue" | "pink" | "purple" | "green" | "orange" | "yellow" | "indigo";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string: "2025-01-06T09:00:00"
  end: string; // ISO string: "2025-01-06T09:30:00"
  color: EventColor;
  category: "all" | "shared" | "public" | "archived";
  hasDot?: boolean;
  dotColor?: string;
  location?: string;
  description?: string;
}

export const EVENT_COLOR_STYLES: Record<
  EventColor,
  {
    card: string;
    text: string;
    dot: string;
    badge: string;
  }
> = {
  gray: {
    card: "bg-neutral-100/90 border-neutral-200/90 text-neutral-800 dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-neutral-200",
    text: "text-neutral-700 dark:text-neutral-300",
    dot: "bg-neutral-500",
    badge: "bg-neutral-200/80 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  },
  blue: {
    card: "bg-sky-50/90 border-sky-200/90 text-sky-800 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300",
    text: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300",
  },
  pink: {
    card: "bg-pink-50/90 border-pink-200/90 text-pink-800 dark:bg-pink-950/40 dark:border-pink-800 dark:text-pink-300",
    text: "text-pink-600 dark:text-pink-400",
    dot: "bg-pink-500",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300",
  },
  purple: {
    card: "bg-purple-50/90 border-purple-200/90 text-purple-800 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300",
    text: "text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300",
  },
  indigo: {
    card: "bg-indigo-50/90 border-indigo-200/90 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300",
  },
  green: {
    card: "bg-emerald-50/90 border-emerald-200/90 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300",
  },
  orange: {
    card: "bg-orange-50/90 border-orange-200/90 text-orange-800 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300",
  },
  yellow: {
    card: "bg-amber-50/90 border-amber-200/90 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300",
  },
};

// Base benchmark date shown in UI.png: Friday Jan 10, 2025
export const DEFAULT_CALENDAR_DATE = new Date("2025-01-10T14:20:00");

// The exact dataset from Untitled UI Calendar
export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "event-01",
    title: "Monday standup",
    start: "2025-01-06T09:00:00",
    end: "2025-01-06T09:30:00",
    color: "gray",
    category: "all",
    location: "Meeting Room A",
    description: "Weekly engineering kick-off and priority alignment.",
  },
  {
    id: "event-02",
    title: "Content planning",
    start: "2025-01-06T11:00:00",
    end: "2025-01-06T12:45:00",
    color: "blue",
    category: "shared",
    location: "Google Meet",
    description: "Review Q1 roadmap and editorial calendar content.",
  },
  {
    id: "event-03",
    title: "One-on-one with Eva",
    start: "2025-01-07T10:00:00",
    end: "2025-01-07T11:15:00",
    color: "pink",
    category: "all",
    location: "Room 102",
    description: "Bi-weekly design review and progress check.",
  },
  {
    id: "event-04",
    title: "Catch up w/ Alex",
    start: "2025-01-07T15:30:00",
    end: "2025-01-07T16:45:00",
    color: "purple",
    category: "shared",
    location: "Cafe Lounge",
    description: "Quarterly alignment and feedback session.",
  },
  {
    id: "event-05",
    title: "Deep work",
    start: "2025-01-08T09:00:00",
    end: "2025-01-08T10:45:00",
    color: "blue",
    category: "all",
    description: "Focus time for core component architecture.",
  },
  {
    id: "event-06",
    title: "Design sync",
    start: "2025-01-08T10:30:00",
    end: "2025-01-08T11:45:00",
    color: "indigo",
    category: "all",
    location: "Design Studio",
    description: "Figma design system sync and token updates.",
  },
  {
    id: "event-07",
    title: "SEO planning",
    start: "2025-01-08T13:30:00",
    end: "2025-01-08T14:45:00",
    color: "indigo",
    category: "shared",
    location: "Marketing Room",
    description: "Organic search optimization strategy for Next.js app.",
  },
  {
    id: "event-08",
    title: "Meetup event",
    start: "2025-01-08T15:00:00",
    end: "2025-01-08T16:45:00",
    color: "yellow",
    category: "public",
    location: "Main Auditorium",
    description: "Monthly tech meetup and developer showcase.",
  },
  {
    id: "event-09",
    title: "Lunch with Olivia",
    start: "2025-01-09T12:00:00",
    end: "2025-01-09T13:15:00",
    color: "green",
    category: "all",
    hasDot: true,
    dotColor: "bg-emerald-500",
    location: "Green Cafe",
    description: "Lunch & informal catch-up.",
  },
  {
    id: "event-10",
    title: "Friday standup",
    start: "2025-01-10T09:00:00",
    end: "2025-01-10T09:30:00",
    color: "gray",
    category: "all",
    location: "Zoom Room 4",
    description: "End-of-week demo wrap-up.",
  },
  {
    id: "event-11",
    title: "Olivia x Riley",
    start: "2025-01-10T10:00:00",
    end: "2025-01-10T11:15:00",
    color: "purple",
    category: "shared",
    location: "Creative Pod 2",
    description: "Creative brainstorming for landing page hero.",
  },
  {
    id: "event-12",
    title: "Product demo",
    start: "2025-01-10T13:30:00",
    end: "2025-01-10T15:45:00",
    color: "blue",
    category: "public",
    location: "Demo Theater",
    description: "Live product walkthrough for stakeholders.",
  },
  {
    id: "event-13",
    title: "House inspection",
    start: "2025-01-11T11:00:00",
    end: "2025-01-11T11:45:00",
    color: "orange",
    category: "all",
    hasDot: true,
    dotColor: "bg-orange-500",
    location: "142 Elm St",
    description: "Property inspection appointment.",
  },
  {
    id: "event-14",
    title: "Ava's engagment par...",
    start: "2025-01-12T13:30:00",
    end: "2025-01-12T14:45:00",
    color: "purple",
    category: "public",
    hasDot: true,
    dotColor: "bg-purple-500",
    location: "Harbor Garden",
    description: "Ava & Michael's engagement party celebration.",
  },
];
