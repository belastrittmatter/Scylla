import type { CalendarEvent } from "@/components/reui/event-calendar/event-calendar-types";

export interface CustomEventData {
  category: "all" | "shared" | "public" | "archived";
  hasDot?: boolean;
  dotColor?: string;
  location?: string;
  description?: string;
  meetingUrl?: string;
  attendees?: Array<{
    name?: string;
    email: string;
    avatar?: string;
    role?: string;
  }>;
  isSlot?: boolean;
  status?: string;
  source?: "google" | "db";
  organizer?: { id?: string; name?: string; email?: string; avatar?: string };
  roomDetails?: {
    id?: string;
    name?: string;
    building?: string;
    floor?: string;
    capacity?: number;
    equipment?: string[];
  };
  projectId?: string;
  project?: {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
    teamId: string;
    teamSlug?: string;
  };
}

// Benchmark date in UI.png: Friday, January 10, 2025 at 2:20 PM
export const BENCHMARK_DATE = new Date(2025, 0, 10, 14, 20);

// Purged mock data: Events are now dynamically fetched via /api/slots/find and /api/bookings
export const INITIAL_REUI_EVENTS: CalendarEvent<CustomEventData>[] = [];
