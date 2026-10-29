import type { BookedResult, InviteData, InviteRoom } from "./booking-types";

export const formatSlotTime = (isoString: string, timeZone: string) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(isoString));
  } catch {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

export const formatFullDate = (isoString: string, timeZone: string) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(isoString));
  } catch {
    return new Date(isoString).toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

export const buildGoogleCalendarUrl = (
  booking: BookedResult["booking"],
  invite: InviteData,
  room: InviteRoom | null,
) => {
  const startIso = new Date(booking.startTime)
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "");
  const endIso = new Date(booking.endTime)
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "");
  const meetUrl = booking.googleMeetUrl || booking.meetingUrl || "";
  const locationText =
    meetUrl || (room ? `${room.name} (${room.building || ""})` : "Online");
  const detailsText = `${invite.title}\n${invite.description || ""}\n${
    meetUrl ? `Google Meet: ${meetUrl}\n` : ""
  }Scheduled via Scylla Collective Scheduler`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: booking.title,
    dates: `${startIso}/${endIso}`,
    details: detailsText,
    location: locationText,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
