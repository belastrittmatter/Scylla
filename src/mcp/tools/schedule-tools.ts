import type { McpServer } from "@modelcontextprotocol/server";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { booking, db, user } from "@/db";
import { GoogleCalendarService } from "@/services/google-calendar";
import { RoomService } from "@/services/rooms";
import { SchedulerService } from "@/services/scheduler";
import { UserService } from "@/services/user";
import { buildScheduleComparisonMarkdown, formatEmailToName } from "@/utils/mcp-markdown-builder";
import { getScheduleUiHtml } from "@/utils/mcp-ui-builder";
import { compareSchedulesSchema, findCommonMeetingSlotsSchema } from "../schemas";
import type { McpToolContext } from "../types";

const ictDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function filterIntervalsForDate(
  intervals: readonly { start: string; end: string }[],
  dateStr: string
): { start: string; end: string }[] {
  const dayStart = new Date(`${dateStr}T00:00:00+07:00`).getTime();
  const dayEnd = new Date(`${dateStr}T23:59:59.999+07:00`).getTime();
  if (Number.isNaN(dayStart) || Number.isNaN(dayEnd)) return [...intervals];
  return intervals
    .filter((i) => {
      const s = new Date(i.start).getTime();
      const e = new Date(i.end).getTime();
      return s < dayEnd && e > dayStart;
    })
    .map((i) => {
      const s = new Date(i.start).getTime();
      const e = new Date(i.end).getTime();
      if (s >= dayStart && e <= dayEnd) return i;
      return {
        start: new Date(Math.max(s, dayStart)).toISOString(),
        end: new Date(Math.min(e, dayEnd)).toISOString(),
      };
    });
}

async function loadRoomsAndBusy(
  start: Date,
  end: Date,
  attendeeEmails: string[],
  accessToken?: string | null
) {
  const busyByEmail = new Map<string, { start: string; end: string }[]>();
  const dbNameByEmail = new Map<string, string>();
  const addBusy = (email: string, s: string, e: string) => {
    const key = email.toLowerCase();
    const arr = busyByEmail.get(key) || [];
    if (!arr.some((b) => b.start === s && b.end === e)) arr.push({ start: s, end: e });
    busyByEmail.set(key, arr);
  };
  try {
    const lowerEmails = attendeeEmails.map((e) => e.toLowerCase());
    const [allRooms, bookings, dbUsers] = await Promise.all([
      RoomService.listRooms(undefined, accessToken ? { accessToken } : undefined),
      db
        .select()
        .from(booking)
        .where(
          and(
            eq(booking.status, "confirmed"),
            gte(booking.endTime, start),
            lte(booking.startTime, end)
          )
        ),
      lowerEmails.length > 0
        ? db
            .select()
            .from(user)
            .where(inArray(user.email, lowerEmails))
            .catch(() => [])
        : Promise.resolve([]),
    ]);

    const freeBusyEmails = Array.from(
      new Set([
        ...attendeeEmails,
        ...allRooms.flatMap((r) => [r.email, r.googleResourceEmail]).filter(Boolean),
      ])
    ) as string[];
    const gcalFreeBusy =
      freeBusyEmails.length > 0
        ? await GoogleCalendarService.getFreeBusy(
            freeBusyEmails,
            start,
            end,
            accessToken ? { accessToken } : undefined
          ).catch(() => ({}))
        : {};

    const emailByUserId = new Map<string, string>();
    for (const u of dbUsers) {
      if (u.email) {
        const em = u.email.toLowerCase();
        if (u.id) emailByUserId.set(u.id, em);
        if (u.name) dbNameByEmail.set(em, u.name);
      }
    }

    const roomEmailById = new Map(allRooms.map((r) => [r.id, r.email]));
    for (const b of bookings) {
      const sIso = b.startTime.toISOString();
      const eIso = b.endTime.toISOString();
      const orgEmail = emailByUserId.get(b.organizerUserId);
      if (orgEmail) addBusy(orgEmail, sIso, eIso);
      if (b.roomId) {
        const rEmail = roomEmailById.get(b.roomId);
        if (rEmail) addBusy(rEmail, sIso, eIso);
      }
      for (const a of b.attendees || []) {
        if (a.email) addBusy(a.email, sIso, eIso);
      }
    }
    for (const [email, intervals] of Object.entries(
      gcalFreeBusy as Record<
        string,
        { start: string; end: string }[] | { busy?: { start: string; end: string }[] }
      >
    )) {
      const list = Array.isArray(intervals) ? intervals : intervals?.busy || [];
      for (const b of list) {
        addBusy(email, b.start, b.end);
      }
    }

    const rooms = allRooms.map((r) => {
      const primaryBusy = r.email ? busyByEmail.get(r.email.toLowerCase()) || [] : [];
      const resourceBusy =
        r.googleResourceEmail && r.googleResourceEmail.toLowerCase() !== r.email?.toLowerCase()
          ? busyByEmail.get(r.googleResourceEmail.toLowerCase()) || []
          : [];
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        capacity: r.capacity,
        officeLocation: r.officeLocation,
        busy: [...primaryBusy, ...resourceBusy],
      };
    });
    return { rooms, busyByEmail, dbNameByEmail };
  } catch {
    return { rooms: [], busyByEmail, dbNameByEmail };
  }
}

export function registerScheduleTools(server: McpServer, ctx: McpToolContext) {
  // 0. Register UI Resource for MCP Apps (SEP-1865)
  server.registerResource(
    "calendar_schedule_comparison_app",
    "ui://calendar/schedule-comparison",
    {
      mimeType: "text/html;profile=mcp-app",
      description:
        "MCP App UI resource for find_common_meeting_slots and compare_schedules. Renders multi-person and meeting-room busy/free timelines (08:00-18:00 ICT) and invokes book_meeting, find_common_meeting_slots, and list_meeting_rooms.",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html;profile=mcp-app",
          text: getScheduleUiHtml(),
        },
      ],
    })
  );

  // 1. Tool: find_common_meeting_slots
  server.registerTool(
    "find_common_meeting_slots",
    {
      description:
        "Compute mutual conflict-free meeting time slots across attendees (emails or names/nicknames like 'alex') and physical rooms using Google Calendar Free/Busy. Returns a Markdown summary and mounts the interactive calendar_schedule_comparison_app (ui://calendar/schedule-comparison) for slot selection, room filtering, and direct booking.",
      inputSchema: findCommonMeetingSlotsSchema,
      _meta: {
        ui: {
          resourceUri: "ui://calendar/schedule-comparison",
          visibility: ["model", "app"],
        },
        "ui/resourceUri": "ui://calendar/schedule-comparison",
      },
    },
    async ({
      attendees,
      durationMinutes,
      startDate,
      endDate,
      timezone = "Asia/Ho_Chi_Minh",
      roomId,
      suggestedTitle,
    }) => {
      const [token, currentUserProfile] = await Promise.all([
        ctx.getAccessToken(),
        ctx.getCurrentUser(),
      ]);
      const currentEmail = (currentUserProfile.email || "me@example.com").toLowerCase();

      const resolvedAttendees: string[] = [currentEmail];
      const nameByEmail = new Map<string, string>();
      if (currentUserProfile.name) nameByEmail.set(currentEmail, currentUserProfile.name);

      const candidateInputs = attendees
        .map((att) => att.trim())
        .filter((trimmed) => {
          if (!trimmed) return false;
          const lower = trimmed.toLowerCase();
          return !(
            lower === "me" ||
            lower === "self" ||
            lower === "myself" ||
            lower === currentEmail ||
            (currentUserProfile.name && lower === currentUserProfile.name.toLowerCase())
          );
        });

      const resolvedCandidates = await Promise.all(
        candidateInputs.map(async (trimmed) => {
          if (trimmed.includes("@")) {
            return { email: trimmed.toLowerCase(), name: undefined as string | undefined };
          }
          try {
            const matches = await UserService.searchTeammates(trimmed, 1, {
              accessToken: token || undefined,
            });
            if (matches.length > 0 && matches[0].email) {
              return {
                email: matches[0].email.toLowerCase(),
                name: matches[0].name || undefined,
              };
            }
          } catch {
            // fallback below
          }
          const email = await ctx.resolveAttendeeEmail(trimmed, token);
          return { email, name: undefined as string | undefined };
        })
      );

      for (const { email, name } of resolvedCandidates) {
        if (email && !resolvedAttendees.includes(email)) {
          resolvedAttendees.push(email);
        }
        if (email && name && !nameByEmail.has(email)) {
          nameByEmail.set(email, name);
        }
      }

      let start: Date;
      let end: Date;
      if (startDate) {
        const dateOnly = startDate.split("T")[0];
        start = startDate.includes("T")
          ? new Date(startDate)
          : new Date(`${dateOnly}T00:00:00+07:00`);
      } else {
        start = new Date();
      }

      if (endDate) {
        const dateOnly = endDate.split("T")[0];
        end = endDate.includes("T") ? new Date(endDate) : new Date(`${dateOnly}T23:59:59+07:00`);
      } else {
        end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      const { rooms, busyByEmail, dbNameByEmail } = await loadRoomsAndBusy(
        start,
        end,
        resolvedAttendees,
        token
      );
      const selectedRoom = roomId ? rooms.find((r) => String(r.id) === String(roomId)) : null;

      const prefetchedBusy: { start: string; end: string }[] = [];
      for (const em of resolvedAttendees) {
        const list = busyByEmail.get(em.toLowerCase());
        if (list) prefetchedBusy.push(...list);
      }
      if (selectedRoom?.email) {
        const roomBusy = busyByEmail.get(selectedRoom.email.toLowerCase());
        if (roomBusy) prefetchedBusy.push(...roomBusy);
      }

      const slots = await SchedulerService.findSlots({
        eventTypeId: "custom",
        durationMinutes,
        startDate: start,
        endDate: end,
        timeZone: timezone,
        attendees: resolvedAttendees,
        roomId,
        accessToken: token || undefined,
        prefetchedBusy,
      });

      const getName = (em: string) =>
        nameByEmail.get(em) || dbNameByEmail.get(em.toLowerCase()) || formatEmailToName(em);

      const otherPeopleEmails = resolvedAttendees.filter(
        (e) =>
          e.toLowerCase() !== currentEmail &&
          e.includes("@") &&
          !e.toLowerCase().includes("resource.calendar.google.com")
      );
      const primaryTargetEmail = otherPeopleEmails[0] || currentEmail;

      const rawDateStr = startDate ? startDate.split("T")[0] : ictDateFormatter.format(new Date());
      const allMutualSlots = slots.map((s) => ({ start: s.start, end: s.end }));
      const slotsOnStartDay = filterIntervalsForDate(allMutualSlots, rawDateStr);
      const dateStr =
        slotsOnStartDay.length === 0 && allMutualSlots.length > 0
          ? allMutualSlots[0].start.split("T")[0]
          : rawDateStr;
      const mutualSlotsArr = filterIntervalsForDate(allMutualSlots, dateStr);
      const getBusyForDate = (em: string) =>
        filterIntervalsForDate(busyByEmail.get(em.toLowerCase()) || [], dateStr);
      const dayRooms = rooms.map((r) => ({
        ...r,
        busy: filterIntervalsForDate(r.busy, dateStr),
      }));

      const currentUserObj = {
        name: currentUserProfile.name || dbNameByEmail.get(currentEmail) || "You",
        email: currentEmail,
        busy: getBusyForDate(currentEmail),
      };
      const targetUserObj = {
        name: getName(primaryTargetEmail),
        email: primaryTargetEmail,
        busy: getBusyForDate(primaryTargetEmail),
      };
      const otherPeople = otherPeopleEmails.map((email) => ({
        name: getName(email),
        email,
        busy: getBusyForDate(email),
      }));

      const markdown = buildScheduleComparisonMarkdown({
        currentUser: currentUserObj,
        targetUser: targetUserObj,
        allAttendees: otherPeople,
        dateStr,
        mutualSlots: mutualSlotsArr,
        durationMinutes,
        room: selectedRoom
          ? { name: selectedRoom.name, capacity: selectedRoom.capacity, email: selectedRoom.email }
          : null,
        suggestedTitle: suggestedTitle || undefined,
      });

      const structuredContent = {
        currentUser: currentUserObj,
        targetUser: targetUserObj,
        allAttendees: otherPeople,
        dateStr,
        mutualSlots: mutualSlotsArr,
        durationMinutes,
        rooms: dayRooms,
        selectedRoomId: selectedRoom?.id || roomId,
        suggestedTitle: suggestedTitle || undefined,
      };

      const html = getScheduleUiHtml(structuredContent);

      return {
        content: [
          {
            type: "text",
            text: markdown,
          },
          {
            type: "resource",
            resource: {
              uri: "ui://calendar/schedule-comparison",
              mimeType: "text/html;profile=mcp-app",
              text: html,
            },
          },
        ],
        structuredContent,
      };
    }
  );

  // 2. Tool: compare_schedules
  server.registerTool(
    "compare_schedules",
    {
      description:
        "Compare the authenticated user's schedule with a target colleague's busy periods and compute mutual free slots for a single date. Returns a Markdown summary and mounts the interactive calendar_schedule_comparison_app (ui://calendar/schedule-comparison) for slot selection, room filtering, and direct booking.",
      inputSchema: compareSchedulesSchema,
      _meta: {
        ui: {
          resourceUri: "ui://calendar/schedule-comparison",
          visibility: ["model", "app"],
        },
        "ui/resourceUri": "ui://calendar/schedule-comparison",
      },
    },
    async ({
      targetUser: targetUserParam,
      date,
      durationMinutes = 30,
      timezone = "Asia/Ho_Chi_Minh",
      roomId,
      roomEmail,
      suggestedTitle,
      suggestedAgenda,
    }) => {
      const [token, currentUserProfile] = await Promise.all([
        ctx.getAccessToken(),
        ctx.getCurrentUser(),
      ]);

      let targetEmail = targetUserParam.trim();
      let targetProfile: {
        name: string;
        email: string;
        avatarUrl?: string | null;
        title?: string;
      } = {
        name: targetEmail,
        email: targetEmail,
      };

      const teammates = await UserService.searchTeammates(targetUserParam, 5, {
        accessToken: token || undefined,
      });

      if (teammates.length > 0) {
        const match = teammates[0];
        targetEmail = match.email;
        targetProfile = {
          name: match.name,
          email: match.email,
          avatarUrl: match.avatarUrl || match.image,
          title: match.title || match.department,
        };
      } else if (!targetEmail.includes("@")) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Could not find any teammate or contact matching "${targetUserParam}". Please check the name or provide an email address.`,
            },
          ],
        };
      }

      const dateStr = date ? date.split("T")[0] : ictDateFormatter.format(new Date());
      const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);

      const currentEmail = currentUserProfile.email || "me@example.com";

      const { rooms, busyByEmail } = await loadRoomsAndBusy(
        startOfDay,
        endOfDay,
        [currentEmail, targetEmail],
        token
      );
      const selectedRoom = rooms.find(
        (r) =>
          (roomId && String(r.id) === String(roomId)) ||
          (roomEmail && r.email.toLowerCase() === roomEmail.toLowerCase())
      );

      const prefetchedBusy: { start: string; end: string }[] = [
        ...(busyByEmail.get(currentEmail.toLowerCase()) || []),
        ...(busyByEmail.get(targetEmail.toLowerCase()) || []),
        ...(selectedRoom?.email ? busyByEmail.get(selectedRoom.email.toLowerCase()) || [] : []),
      ];

      const slots = await SchedulerService.findSlots({
        eventTypeId: "custom",
        durationMinutes,
        startDate: startOfDay,
        endDate: endOfDay,
        timeZone: timezone,
        attendees: [currentEmail, targetEmail],
        roomId,
        accessToken: token || undefined,
        prefetchedBusy,
      });

      const currentUserObj = {
        name: currentUserProfile.name || "You",
        email: currentEmail,
        busy: busyByEmail.get(currentEmail.toLowerCase()) || [],
      };
      const targetProfileWithBusy = {
        ...targetProfile,
        busy: busyByEmail.get(targetEmail.toLowerCase()) || [],
      };
      const mutualSlotsArr = slots.map((s) => ({ start: s.start, end: s.end }));

      const effectiveTitle =
        suggestedTitle || `1:1 Sync: ${currentUserObj.name} & ${targetProfile.name}`;

      const markdown = buildScheduleComparisonMarkdown({
        currentUser: currentUserObj,
        targetUser: targetProfileWithBusy,
        dateStr,
        mutualSlots: mutualSlotsArr,
        durationMinutes,
        room: selectedRoom
          ? { name: selectedRoom.name, capacity: selectedRoom.capacity, email: selectedRoom.email }
          : null,
        suggestedTitle: effectiveTitle,
      });

      const structuredContent = {
        currentUser: currentUserObj,
        targetUser: targetProfileWithBusy,
        dateStr,
        mutualSlots: mutualSlotsArr,
        durationMinutes,
        rooms,
        selectedRoomId: selectedRoom?.id || roomId,
        suggestedTitle: effectiveTitle,
        suggestedAgenda: suggestedAgenda || "",
      };

      const html = getScheduleUiHtml(structuredContent);

      return {
        content: [
          {
            type: "text",
            text: markdown,
          },
          {
            type: "resource",
            resource: {
              uri: "ui://calendar/schedule-comparison",
              mimeType: "text/html;profile=mcp-app",
              text: html,
            },
          },
        ],
        structuredContent,
      };
    }
  );
}
