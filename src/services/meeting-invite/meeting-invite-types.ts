import type { MeetingInvite, MeetingRoom } from "@/db/schema";

/** Expected booking failures; routes map `status` to the HTTP response and may echo `message`. */
export class MeetingInviteError extends Error {
  status: 400 | 403 | 404 | 409;
  constructor(message: string, status: 400 | 403 | 404 | 409) {
    super(message);
    this.status = status;
  }
}

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
  timeZone?: string; // guest display zone; never used for working hours
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

/** Shape served to unauthenticated guests: no emails, user ids or internal lists. */
export interface PublicInviteDetails {
  invite: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    duration: number;
    locationType: string;
    roomId: string | null;
    isActive: boolean;
    isRestricted: boolean;
  };
  organizer: { name: string; image: string | null } | null;
  room: Omit<MeetingRoom, "email" | "googleResourceEmail"> | null;
  members: Array<{ id: string; name: string; image: string | null }>;
}

export function toPublicInviteDetails(
  details: InviteDetails,
): PublicInviteDetails {
  const { invite, organizer, room } = details;
  let publicRoom: PublicInviteDetails["room"] = null;
  if (room) {
    const { email: _email, googleResourceEmail: _gre, ...rest } = room;
    publicRoom = rest;
  }
  return {
    invite: {
      id: invite.id,
      slug: invite.slug,
      title: invite.title,
      description: invite.description,
      duration: invite.duration,
      locationType: invite.locationType,
      roomId: invite.roomId,
      isActive: invite.isActive,
      isRestricted: invite.isRestricted,
    },
    organizer: organizer
      ? { name: organizer.name, image: organizer.image }
      : null,
    room: publicRoom,
    // Opaque positional ids: real ids are user ids or, for unregistered members, emails.
    members: details.members.map((m, i) => ({
      id: `member-${i}`,
      name: m.name,
      image: m.image,
    })),
  };
}
