import type { Teammate } from "@/services/user";
import type { RoomFilter } from "@/services/rooms";
import type { FindSlotsParams, TimeSlot } from "@/services/scheduler";
import type { CreateBookingPayload, ReschedulePayload } from "@/services/booking";
import type { Booking, MeetingRoom, EventType } from "@/db/schema";

export type {
  Teammate,
  RoomFilter,
  FindSlotsParams,
  TimeSlot,
  CreateBookingPayload,
  ReschedulePayload,
  Booking,
  MeetingRoom,
  EventType,
};

/**
 * Returns the appropriate base URL for API requests.
 * Uses window.location.origin in the browser, or falls back to localhost:3000 during testing / SSR.
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  if (process.env.NODE_ENV === "test") {
    headers.set("x-bypass-auth", "true");
  }

  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage =
          typeof errorData.error === "string" ? errorData.error : JSON.stringify(errorData.error);
      }
    } catch {
      // Ignore JSON parse failure
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  users: {
    /**
     * Search teammates by name or email substring.
     * Maps to: GET /api/users/search?q={query}&limit={limit}
     */
    search: async (query: string = "", limit?: number): Promise<Teammate[]> => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (limit) params.set("limit", limit.toString());
      const qs = params.toString();
      return request<Teammate[]>(`/api/users/search${qs ? `?${qs}` : ""}`);
    },
  },

  rooms: {
    /**
     * List physical meeting rooms with optional filters.
     * Maps to: GET /api/rooms?minCapacity={n}&features={f}&building={b}
     */
    list: async (filter?: RoomFilter): Promise<MeetingRoom[]> => {
      const params = new URLSearchParams();
      if (filter?.minCapacity) params.set("minCapacity", filter.minCapacity.toString());
      if (filter?.features && filter.features.length > 0) {
        params.set("features", filter.features.join(","));
      }
      if (filter?.building) params.set("building", filter.building);
      const qs = params.toString();
      return request<MeetingRoom[]>(`/api/rooms${qs ? `?${qs}` : ""}`);
    },

    /**
     * Synchronize meeting room catalog with Google Workspace resources.
     * Maps to: POST /api/rooms/sync
     */
    sync: async (): Promise<{ success: boolean; rooms: MeetingRoom[] }> => {
      return request<{ success: boolean; rooms: MeetingRoom[] }>("/api/rooms/sync", {
        method: "POST",
      });
    },
  },

  slots: {
    /**
     * Compute mutual conflict-free meeting slots.
     * Maps to: POST /api/slots/find
     */
    find: async (params: FindSlotsParams): Promise<TimeSlot[]> => {
      return request<TimeSlot[]>("/api/slots/find", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  },

  bookings: {
    /**
     * Fetch user agenda bookings for a given date.
     * Maps to: GET /api/bookings/agenda?date={date}&userId={userId}
     */
    getAgenda: async ({ date, userId }: { date: string; userId?: string }): Promise<Booking[]> => {
      const params = new URLSearchParams({ date });
      if (userId) params.set("userId", userId);
      return request<Booking[]>(`/api/bookings/agenda?${params.toString()}`);
    },

    /**
     * Schedule a new meeting atomically.
     * Maps to: POST /api/bookings
     */
    create: async (payload: CreateBookingPayload): Promise<Booking> => {
      return request<Booking>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    /**
     * Reschedule an existing meeting or update its details.
     * Maps to: PATCH /api/bookings/[id]
     */
    reschedule: async (id: string, payload: ReschedulePayload): Promise<Booking> => {
      return request<Booking>(`/api/bookings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    /**
     * Update meeting details (title, description, room, times).
     * Maps to: PATCH /api/bookings/[id]
     */
    update: async (id: string, payload: ReschedulePayload): Promise<Booking> => {
      return request<Booking>(`/api/bookings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    /**
     * Cancel an existing meeting.
     * Maps to: DELETE /api/bookings/[id]
     */
    cancel: async (id: string): Promise<Booking> => {
      return request<Booking>(`/api/bookings/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  },

  calendar: {
    /**
     * Fetch user working schedule and calendar events (Google Calendar + DB bookings).
     * Maps to: GET /api/calendar?timeMin={timeMin}&timeMax={timeMax}&userId={userId}&attendeeEmails={emails}
     */
    getEvents: async (
      params?: {
        timeMin?: string;
        timeMax?: string;
        userId?: string;
        attendeeEmails?: string[];
      },
      init?: RequestInit
    ): Promise<CalendarResponse> => {
      const qs = new URLSearchParams();
      if (params?.timeMin) qs.set("timeMin", params.timeMin);
      if (params?.timeMax) qs.set("timeMax", params.timeMax);
      if (params?.userId) qs.set("userId", params.userId);
      if (params?.attendeeEmails && params.attendeeEmails.length > 0) {
        qs.set("attendeeEmails", params.attendeeEmails.join(","));
      }
      const queryString = qs.toString();
      return request<CalendarResponse>(
        `/api/calendar${queryString ? `?${queryString}` : ""}`,
        init
      );
    },

    /**
     * Fetch busy intervals of users and meeting rooms directly from Google Free/Busy and DB bookings.
     * Maps to: POST /api/calendar/busy
     */
    getBusy: async (params: {
      emails?: string[];
      roomIds?: string[];
      userIds?: string[];
      timeMin?: string;
      timeMax?: string;
    }): Promise<BusyScheduleResponse> => {
      return request<BusyScheduleResponse>("/api/calendar/busy", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  },

  eventTypes: {
    /**
     * List all available event types / meeting templates.
     * Maps to: GET /api/event-types?userId={userId}
     */
    list: async (userId?: string): Promise<EventType[]> => {
      const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      return request<EventType[]>(`/api/event-types${qs}`);
    },

    /**
     * Get specific event type details and its host by slug or id.
     * Maps to: GET /api/event-types/[slug]
     */
    getBySlug: async (slug: string): Promise<{ eventType: EventType; host: unknown }> => {
      return request<{ eventType: EventType; host: unknown }>(
        `/api/event-types/${encodeURIComponent(slug)}`
      );
    },
  },

  projects: {
    /**
     * List projects, optionally filtered by teamId.
     * Maps to: GET /api/projects?teamId={teamId}
     */
    list: async (
      teamId?: string
    ): Promise<
      Array<{
        id: string;
        name: string;
        slug: string;
        color?: string | null;
        teamId: string;
        teamName?: string | null;
        description?: string | null;
        status?: string;
      }>
    > => {
      const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
      return request(`/api/projects${qs}`);
    },
  },
};

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  start: string;
  end: string;
  color?: string;
  status?: string;
  category?: "all" | "shared" | "public" | "archived";
  attendees?: Array<{ name?: string; email: string }>;
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

export interface CalendarResponse {
  events: CalendarEventItem[];
  workingHours: Array<{ day: number; start: string; end: string }>;
  timeZone: string;
  googleConnected?: boolean;
}

export interface BusyEventItem {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  color: string;
  attendee: {
    name: string;
    email: string;
    type: "user" | "room";
  };
  source: "google" | "db";
}

export interface BusyScheduleResponse {
  timeMin: string;
  timeMax: string;
  totalCalendars: number;
  calendars: Record<
    string,
    {
      name: string;
      email: string;
      type: "user" | "room";
      busy: Array<{ start: string; end: string; source?: "google" | "db" }>;
    }
  >;
  events: BusyEventItem[];
}
