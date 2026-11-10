export interface CalendarAttendeeItem {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  type: "user" | "room";
  details?: string;
  capacity?: number;
}

export interface SelectedAttendee {
  id?: string;
  name?: string;
  email: string;
  avatarUrl?: string;
}
