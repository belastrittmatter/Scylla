import type { McpServer } from "@modelcontextprotocol/server";
import { GoogleCalendarService } from "@/services/google-calendar";
import { RoomService } from "@/services/rooms";
import { db, booking } from "@/db";
import { eq, or } from "drizzle-orm";
import { bookMeetingSchema, rescheduleMeetingSchema, cancelMeetingSchema } from "../schemas";
import { resolveProject } from "./auth-helpers";
import type { McpToolContext } from "../types";

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
    async ({ summary, description, start, end, attendees, roomEmail, roomId, projectId }) => {
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
        Promise.all(attendees.map((att) => ctx.resolveAttendeeEmail(att, token))),
      ]);
      const finalProjectId = linkedProject ? linkedProject.id : null;

      // If a project is linked and summary does not already have its tag, prefix cleanly
      let meetingSummary = summary.trim();
      if (linkedProject && !meetingSummary.startsWith(`[${linkedProject.name}]`)) {
        meetingSummary = `[${linkedProject.name}] ${meetingSummary}`;
      }

      const resolvedAttendees: string[] = [];
      for (const email of resolvedAttendeeRaw) {
        if (email && email.includes("@") && !resolvedAttendees.includes(email)) {
          resolvedAttendees.push(email);
        }
      }

      let event;
      try {
        event = await GoogleCalendarService.createEvent(
          {
            summary: meetingSummary,
            description,
            start,
            end,
            attendees: resolvedAttendees,
            roomEmail: roomEmail || undefined,
            conference: true,
          },
          token
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[MCP book_meeting] Error creating calendar event:", msg, {
          summary: meetingSummary,
          start,
          end,
          attendees: resolvedAttendees,
          roomEmail,
        });
        return {
          isError: true,
          content: [{ type: "text", text: msg }],
        };
      }

      // Record booking in database if user is authenticated
      try {
        if (ctx.userId) {
          const emailTarget = roomEmail || (roomId?.includes("@") ? roomId : undefined);
          const [currentUser, byId, byEmail] = await Promise.all([
            ctx.getCurrentUser().catch(() => null),
            roomId ? RoomService.getRoomById(roomId).catch(() => null) : Promise.resolve(null),
            emailTarget
              ? RoomService.getRoomByEmail(emailTarget).catch(() => null)
              : Promise.resolve(null),
          ]);
          const allAttendeeEmails = Array.from(
            new Set(
              [currentUser?.email, ...resolvedAttendees].filter((e): e is string => Boolean(e))
            )
          );
          const resolvedRoomId: string | null = byId?.id ?? byEmail?.id ?? null;
          await db.insert(booking).values({
            organizerUserId: ctx.userId,
            title: meetingSummary,
            description: description || null,
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
              2
            ),
          },
        ],
      };
    }
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

      // Resolve optional linked project and update Google Calendar event in parallel
      const [linkedProject, updated] = await Promise.all([
        projectId !== undefined
          ? resolveProject(projectId, ctx.userId)
          : Promise.resolve(undefined),
        GoogleCalendarService.updateEvent(
          eventId,
          {
            start: newStart,
            end: newEnd,
            roomEmail,
          },
          token
        ),
      ]);
      const finalProjectId =
        projectId !== undefined ? (linkedProject ? linkedProject.id : null) : undefined;

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
        await db
          .update(booking)
          .set(updateValues)
          .where(
            or(
              eq(booking.id, eventId),
              eq(booking.googleEventId, eventId),
              eq(booking.gcalEventId, eventId)
            )
          );
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
              2
            ),
          },
        ],
      };
    }
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

      const result = await GoogleCalendarService.deleteEvent(eventId, calendarId, token);

      // Update DB record status if present
      try {
        await db
          .update(booking)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(
            or(
              eq(booking.id, eventId),
              eq(booking.googleEventId, eventId),
              eq(booking.gcalEventId, eventId)
            )
          );
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
              2
            ),
          },
        ],
      };
    }
  );
}
