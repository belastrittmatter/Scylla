export interface BusyInterval {
  start: string;
  end: string;
  source?: "google" | "db";
}

export interface CalendarBusyInfo {
  name: string;
  email: string;
  type: "user" | "room";
  busy: BusyInterval[];
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
