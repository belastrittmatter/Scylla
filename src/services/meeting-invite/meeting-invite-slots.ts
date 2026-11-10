import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account } from "@/db/schema";
import { SchedulerService, type TimeSlot } from "@/services/scheduler";
import type { InviteDetails } from "@/services/meeting-invite/meeting-invite-types";

/**
 * Free slots the invite offers inside [start, end]: organizer and member
 * working hours, Google free/busy and confirmed DB bookings.
 */
export async function findInviteSlots(
  details: InviteDetails,
  start: Date,
  end: Date,
): Promise<TimeSlot[]> {
  const { invite, organizer } = details;
  const allAttendees = new Set<string>();
  if (organizer?.email) allAttendees.add(organizer.email.toLowerCase());
  for (const email of invite.memberEmails) {
    allAttendees.add(email.toLowerCase());
  }

  // Public guests have no Google account; free/busy is read with the organizer's own.
  const [organizerAccount] = await db
    .select()
    .from(account)
    .where(
      and(
        eq(account.userId, invite.organizerUserId),
        eq(account.providerId, "google"),
      ),
    )
    .limit(1);

  const slots = await SchedulerService.findSlots({
    accountRecord: organizerAccount,
    attendees: Array.from(allAttendees),
    durationMinutes: invite.duration,
    startDate: start,
    endDate: end,
    roomId: invite.roomId || undefined,
    // No guest zone: it would shift the organizer's and members' working hours.
  });
  return slots.filter((s) => s.available);
}

export async function getAvailableSlotsForInvite(
  details: InviteDetails,
  dateStr: string,
  timeZone = "Asia/Ho_Chi_Minh",
): Promise<TimeSlot[]> {
  const baseDate = new Date(`${dateStr}T12:00:00.000Z`);
  const slots = await findInviteSlots(
    details,
    new Date(baseDate.getTime() - 24 * 3600 * 1000),
    new Date(baseDate.getTime() + 24 * 3600 * 1000),
  );

  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return slots.filter((s) => {
    const slotDate = dateFormatter.format(new Date(s.start));
    return slotDate === dateStr;
  });
}
