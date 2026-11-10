import type { McpServer } from "@modelcontextprotocol/server";
import { GoogleCalendarService } from "@/services/google-calendar";
import { RoomService } from "@/services/rooms";
import { db, booking } from "@/db";
import { eq } from "drizzle-orm";
import { BookingQueryService } from "@/services/booking/booking-query-service";
import { BookingService } from "@/services/booking";
import {
  bookMeetingSchema,
  rescheduleMeetingSchema,
  cancelMeetingSchema,
} from "../schemas";
import { resolveProject, verifyScope } from "./auth-helpers";
import {
  getOrganizerToken,
  sanitizeBookingDescription,
} from "@/services/booking/booking-token-helper";
import type { McpToolContext } from "../types";

// Same rule as the REST routes and Server Actions (organizer or calendar owner).
async function findOwnedBooking(eventId: string, userId: string | undefined) {
  const existing = await BookingQueryService.getBookingById(eventId);
  if (existing && (!userId || !BookingService.canModify(existing, userId))) {
    return {
      forbidden: {
        isError: true as const,
        content: [
          {
            type: "text" as const,
            text: "Forbidden: Only the meeting organizer or calendar owner may modify this booking",
          },
        ],
      },
    };
  }
  if (!existing) return { gcalId: eventId, token: undefined };
  // A stored booking lives on the organizer's calendar under its gcalEventId, like the REST routes.
  return {
    existing,
    gcalId: existing.gcalEventId ?? eventId,
    token: await getOrganizerToken(existing.organizerUserId),
  };
}

export function registerBookingTools(server: McpServer, ctx: McpToolContext) {
  // 1. Tool: book_meeting
  server.registerTool(
    "book_meeting",
    {
      description:
        "Schedule a calendar meeting with an automatic Google Meet video conference. Supports both online-only meetings (no room needed) and in-person meetings with an optional physical room reservation. Suggest title and agenda to the user before booking.",
      inputSchema: bookMeetingSchema,
      _meta: {
        ui: { visibility: ["model", "app"] },
      },
    },
    async ({
      summary,
      description,
      start,
      end,
      attendees,
      roomEmail,
      roomId,
      projectId,
    }) => {
      const scopeErr = verifyScope(ctx, "calendar.events");
      if (scopeErr) return scopeErr;

      if (roomEmail || roomId) {
        const roomScopeErr = verifyScope(ctx, "rooms.reservation");
        if (roomScopeErr) return roomScopeErr;
      }

      let cleanDescription: string | undefined;
      try {
        cleanDescription = sanitizeBookingDescription(description);
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: err instanceof Error ? err.message : String(err),
            },
          ],
        };
      }

      const token = await ctx.getAccessToken();
      if (!token) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Error: No valid Google Calendar authorization available. Please ensure the user is logged in with Google.",
            },
          ],
        };
      }

      // Resolve optional linked project and attendee nicknames in parallel
      const [linkedProject, resolvedAttendeeRaw] = await Promise.all([
        resolveProject(projectId, ctx.userId),
        Promise.all(
          attendees.map((att) => ctx.resolveAttendeeEmail(att, token)),
        ),
      ]);
      const finalProjectId = linkedProject ? linkedProject.id : null;

      // If a project is linked and summary does not already have its tag, prefix cleanly
      let meetingSummary = summary.trim();
      if (
        linkedProject &&
        !meetingSummary.startsWith(`[${linkedProject.name}]`)
      ) {
        meetingSummary = `[${linkedProject.name}] ${meetingSummary}`;
      }

      const resolvedAttendees: string[] = [];
      for (const email of resolvedAttendeeRaw) {
        if (
          email &&
          email.includes("@") &&
          !resolvedAttendees.includes(email)
        ) {
          resolvedAttendees.push(email);
        }
      }

      let event;
      try {
        event = await GoogleCalendarService.createEvent(
          {
            summary: meetingSummary,
            description: cleanDescription,
            start,
            end,
            attendees: resolvedAttendees,
            roomEmail: roomEmail || undefined,
            conference: true,
          },
          token,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          "[MCP book_meeting] Error creating calendar event:",
          msg,
          {
            summary: meetingSummary,
            start,
            end,
            attendees: resolvedAttendees,
            roomEmail,
          },
        );
        return {
          isError: true,
          content: [{ type: "text", text: msg }],
        };
      }

      // Record booking in database if user is authenticated
      try {
        if (ctx.userId) {
          const emailTarget =
            roomEmail || (roomId?.includes("@") ? roomId : undefined);
          const [currentUser, byId, byEmail] = await Promise.all([
            ctx.getCurrentUser().catch(() => null),
            roomId
              ? RoomService.getRoomById(roomId).catch(() => null)
              : Promise.resolve(null),
            emailTarget
              ? RoomService.getRoomByEmail(emailTarget).catch(() => null)
              : Promise.resolve(null),
          ]);
          const allAttendeeEmails = Array.from(
            new Set(
              [currentUser?.email, ...resolvedAttendees].filter(
                (e): e is string => Boolean(e),
              ),
            ),
          );
          const resolvedRoomId: string | null = byId?.id ?? byEmail?.id ?? null;
          await db.insert(booking).values({
            organizerUserId: ctx.userId,
            title: meetingSummary,
            description: cleanDescription || null,
            startTime: new Date(start),
            endTime: new Date(end),
            status: "confirmed",
            roomId: resolvedRoomId,
            projectId: finalProjectId,
            attendees: allAttendeeEmails.map((email) => ({
              name: email.split("@")[0] || email,
              email,
            })),
            googleEventId: event.id,
            gcalEventId: event.id,
            meetingUrl: event.meetingUrl || event.hangoutsLink || null,
          });
        }
      } catch (dbErr) {
        console.warn("Could not record booking in DB:", dbErr);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "Meeting booked successfully on Google Calendar",
                eventId: event.id,
                summary: event.summary,
                start: event.start.dateTime,
                end: event.end.dateTime,
                meetingUrl: event.meetingUrl || event.hangoutsLink,
                attendees: event.attendees,
                status: event.status,
                hasRoom: Boolean(roomEmail),
                projectId: finalProjectId,
                projectName: linkedProject ? linkedProject.name : undefined,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 2. Tool: reschedule_meeting
  server.registerTool(
    "reschedule_meeting",
    {
      description:
        "Reschedule an existing meeting to a new time on Google Calendar, updating the Google Meet conference and optional room booking.",
      inputSchema: rescheduleMeetingSchema,
    },
    async ({ eventId, newStart, newEnd, roomEmail, projectId }) => {
      const scopeErr = verifyScope(ctx, "calendar.events");
      if (scopeErr) return scopeErr;

      if (roomEmail) {
        const roomScopeErr = verifyScope(ctx, "rooms.reservation");
        if (roomScopeErr) return roomScopeErr;
      }

      const token = await ctx.getAccessToken();
      if (!token) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Error: No valid Google Calendar authorization available.",
            },
          ],
        };
      }

      const {
        existing,
        forbidden,
        gcalId,
        token: organizerToken,
      } = await findOwnedBooking(eventId, ctx.userId);
      if (forbidden) return forbidden;

      // Resolve optional linked project and update Google Calendar event in parallel
      const [linkedProject, updated] = await Promise.all([
        projectId !== undefined
          ? resolveProject(projectId, ctx.userId)
          : Promise.resolve(undefined),
        GoogleCalendarService.updateEvent(
          gcalId,
          {
            start: newStart,
            end: newEnd,
            roomEmail,
          },
          organizerToken ?? token,
        ),
      ]);
      const finalProjectId =
        projectId !== undefined
          ? linkedProject
            ? linkedProject.id
            : null
          : undefined;

      // Also update DB booking record if found
      try {
        const updateValues: Record<string, unknown> = {
          startTime: new Date(newStart),
          endTime: new Date(newEnd),
          updatedAt: new Date(),
        };
        if (finalProjectId !== undefined) {
          updateValues.projectId = finalProjectId;
        }
        if (existing) {
          await db
            .update(booking)
            .set(updateValues)
            .where(eq(booking.id, existing.id));
        }
      } catch (dbErr) {
        console.warn("Could not sync reschedule to DB:", dbErr);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "Meeting rescheduled successfully",
                eventId: updated.id,
                start: updated.start.dateTime,
                end: updated.end.dateTime,
                meetingUrl: updated.meetingUrl,
                projectId: finalProjectId,
                projectName: linkedProject ? linkedProject.name : undefined,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 3. Tool: cancel_meeting
  server.registerTool(
    "cancel_meeting",
    {
      description:
        "Cancel an existing meeting, release the physical room, and remove it from Google Calendar.",
      inputSchema: cancelMeetingSchema,
    },
    async ({ eventId, calendarId = "primary" }) => {
      const scopeErr = verifyScope(ctx, "calendar.events");
      if (scopeErr) return scopeErr;

      const token = await ctx.getAccessToken();
      if (!token) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Error: No valid Google Calendar authorization available.",
            },
          ],
        };
      }

      const {
        existing,
        forbidden,
        gcalId,
        token: organizerToken,
      } = await findOwnedBooking(eventId, ctx.userId);
      if (forbidden) return forbidden;

      const result = await GoogleCalendarService.deleteEvent(
        gcalId,
        calendarId,
        organizerToken ?? token,
      );

      // Update DB record status if present
      try {
        if (existing) {
          await db
            .update(booking)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(booking.id, existing.id));
        }
      } catch (dbErr) {
        console.warn("Could not sync cancellation to DB:", dbErr);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "Meeting cancelled successfully",
                result,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
