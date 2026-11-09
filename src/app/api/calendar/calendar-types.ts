export interface UnifiedCalendarEvent {
  id: string;
  title: string;
  description?: string;
  seriesId?: string;
  recurringEventId?: string;
  location?: string;
  meetingUrl?: string;
  start: string;
  end: string;
  color?: string;
  status?: string;
  category?: "all" | "shared" | "public" | "archived";
  attendees?: Array<{
    name?: string;
    email: string;
    avatar?: string;
    role?: string;
  }>;
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

export const ATTENDEE_COLORS = [
  "#e11d48", // rose-600
  "#8b5cf6", // violet-500
  "#d97706", // amber-600
  "#059669", // emerald-600
  "#0891b2", // cyan-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#4f46e5", // indigo-600
];

export function isOfficeOrWorkingLocation(
  summary?: string,
  eventType?: string,
): boolean {
  if (eventType === "workingLocation") return true;
  if (!summary) return false;
  const s = summary.toLowerCase();
  return (
    s.includes("(office)") ||
    s.includes("(home)") ||
    s.includes("(remote)") ||
    s.startsWith("working from") ||
    s.includes("working location")
  );
}
