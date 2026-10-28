export interface InviteOrganizer {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface InviteMember {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface InviteRoom {
  id: string;
  name: string;
  email?: string;
  capacity?: number | null;
  building?: string | null;
  floor?: string | null;
  features?: string[] | null;
  equipment?: string[] | null;
  officeLocation?: string | null;
  description?: string | null;
}

export interface InviteData {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  duration: number;
  organizerUserId: string;
  memberEmails: string[];
  locationType: "meet" | "room" | string;
  roomId?: string | null;
  isActive: boolean;
  isRestricted?: boolean;
  allowedEmails?: string[];
}

export interface InviteDetails {
  invite: InviteData;
  organizer: InviteOrganizer | null;
  room: InviteRoom | null;
  members: InviteMember[];
}

export interface Slot {
  start: string;
  end: string;
  available: boolean;
}

export interface BookedResult {
  booking: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    googleMeetUrl?: string | null;
    meetingUrl?: string | null;
    status: string;
    attendees: Array<{ email: string; name?: string }>;
  };
  invite: InviteData;
}
