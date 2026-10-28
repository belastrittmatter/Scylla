export interface MeetingAttendee {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface MeetingItem {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date format: YYYY-MM-DD
  startTime: string;
  endTime: string;
  duration: string;
  location: string;
  locationType: "room" | "virtual" | "in-person";
  meetingUrl?: string;
  color?: string;
  status: "upcoming" | "in-progress" | "completed";
  organizer: MeetingAttendee;
  attendees: MeetingAttendee[];
  tags?: string[];
  roomDetails?: {
    name: string;
    capacity: number;
    floor: string;
    facilities: string[];
  };
}

// Purged mock data: Meetings are fetched dynamically from backend API /api/bookings
export const INITIAL_MEETINGS: MeetingItem[] = [];
