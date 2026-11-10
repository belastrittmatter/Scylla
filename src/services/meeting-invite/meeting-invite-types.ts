import type { MeetingInvite, MeetingRoom } from "@/db/schema";

export interface CreateMeetingInviteInput {
  title: string;
  description?: string;
  duration?: number;
  organizerUserId: string;
  memberEmails: string[];
  locationType?: "meet" | "room";
  roomId?: string;
  isRestricted?: boolean;
  allowedEmails?: string[];
}

export interface BookMeetingInviteInput {
  slug: string;
  guestName: string;
  guestEmail: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  notes?: string;
}

export interface InvitePerson {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface InviteDetails {
  invite: MeetingInvite;
  organizer: InvitePerson | null;
  room: MeetingRoom | null;
  members: InvitePerson[];
}

export interface PublicInviteDetails {
  invite: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    duration: number;
    organizerUserId: string;
    memberEmails?: string[];
    locationType: string;
    roomId: string | null;
    isActive: boolean;
    isRestricted: boolean;
    allowedEmails?: string[];
  };
  organizer: InvitePerson | null;
  room: MeetingRoom | null;
  members: InvitePerson[];
}

export function toPublicInviteDetails(
  details: InviteDetails,
): PublicInviteDetails {
  return {
    invite: {
      id: details.invite.id,
      slug: details.invite.slug,
      title: details.invite.title,
      description: details.invite.description,
      duration: details.invite.duration,
      organizerUserId: details.invite.organizerUserId,
      memberEmails: undefined,
      locationType: details.invite.locationType,
      roomId: details.invite.roomId,
      isActive: details.invite.isActive,
      isRestricted: details.invite.isRestricted,
      allowedEmails: undefined,
    },
    organizer: details.organizer
      ? {
          id: details.organizer.id,
          name: details.organizer.name,
          email: "",
          image: details.organizer.image,
        }
      : null,
    room: details.room,
    members: details.members.map((m) => ({
      id: m.id,
      name: m.name,
      email: "",
      image: m.image,
    })),
  };
}
