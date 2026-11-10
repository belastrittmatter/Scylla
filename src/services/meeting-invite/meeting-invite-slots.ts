import { SchedulerService, type TimeSlot } from "../scheduler";
import type { InviteDetails } from "./meeting-invite-types";

export async function getAvailableSlotsForInvite(
  details: InviteDetails,
  dateStr: string,
  timeZone = "Asia/Ho_Chi_Minh",
): Promise<TimeSlot[]> {
  const { invite, organizer } = details;
  const allAttendees = new Set<string>();
  if (organizer?.email) allAttendees.add(organizer.email.toLowerCase());
  for (const email of invite.memberEmails) {
    allAttendees.add(email.toLowerCase());
  }

  const baseDate = new Date(`${dateStr}T12:00:00.000Z`);
  const startDate = new Date(
    baseDate.getTime() - 24 * 3600 * 1000,
  ).toISOString();
  const endDate = new Date(baseDate.getTime() + 24 * 3600 * 1000).toISOString();

  const slots = await SchedulerService.findSlots({
    attendees: Array.from(allAttendees),
    durationMinutes: invite.duration,
    startDate,
    endDate,
    roomId: invite.roomId || undefined,
    timeZone,
  });

  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return slots.filter((s) => {
    if (!s.available) return false;
    const slotDate = dateFormatter.format(new Date(s.start));
    return slotDate === dateStr;
  });
}
