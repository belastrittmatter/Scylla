import { z } from "zod";

const timeZoneSchema = z.string().refine(
  (tz) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid IANA time zone" },
);

export const inviteSlotsBodySchema = z.object({
  // z.iso.date() also rejects impossible dates such as 2026-02-30
  date: z.iso.date(),
  timeZone: timeZoneSchema.optional(),
});

export const bookInviteBodySchema = z.object({
  guestName: z.string().trim().min(1).max(200),
  guestEmail: z.email().max(320),
  startTime: z.iso.datetime({ offset: true }),
  endTime: z.iso.datetime({ offset: true }),
  notes: z.string().max(5000).optional(),
  timeZone: timeZoneSchema.optional(),
});
