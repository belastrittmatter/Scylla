import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "bun:test";
import {
  extractData,
  fmtTime,
  fmtDay,
  formatEmailToName,
  formatNames,
  getAttendeeNames,
} from "@/components/mcp-ui/use-mcp-bridge";
import {
  AgendaApp,
  formatTimelineBlockLabel,
} from "@/components/mcp-ui/agenda-app";
import { ScheduleApp } from "@/components/mcp-ui/schedule-app";
import {
  expandTo15MinSlots,
  getRoomBusyIntervals,
  isIntervalBusy,
  isRoomBusyAt,
} from "@/components/mcp-ui/schedule-helpers";
import { TaskBoardApp } from "@/components/mcp-ui/task-board-app";

describe("MCP UI Bridge & Formatting Helpers", () => {
  it("extracts nested structuredContent payloads from SEP-1865 JSON-RPC envelopes", () => {
    const raw = {
      jsonrpc: "2.0",
      method: "ui/notifications/tool-result",
      params: {
        structuredContent: {
          teamName: "Platform",
          tasks: [{ id: "1", title: "Ship UI", status: "todo" }],
        },
      },
    };
    const extracted = extractData<{ teamName: string; tasks: unknown[] }>(raw);
    expect(extracted?.teamName).toBe("Platform");
    expect(extracted?.tasks).toHaveLength(1);
  });

  it("formats times, days, emails, and attendee names accurately in ICT", () => {
    expect(fmtTime("2026-10-21T02:30:00.000Z")).toBe("09:30");
    expect(fmtDay("2026-10-21T02:30:00.000Z")).toContain("Oct 21");
    expect(formatEmailToName("alex.morgan@example.com")).toBe("Alex Morgan");
    expect(formatNames(["Alice", "Bob", "Charlie"])).toBe(
      "Alice, Bob & Charlie",
    );
    expect(
      getAttendeeNames({
        currentUser: { name: "Alice", email: "alice@example.com" },
        allAttendees: [
          { email: "bob.smith@example.com" },
          "charlie@example.com",
        ],
      }),
    ).toEqual(["Alice", "Bob Smith", "Charlie"]);
  });

  it("renders AgendaApp, ScheduleApp, and TaskBoardApp using shadcn/ui primitives", () => {
    const agendaHtml = renderToString(
      React.createElement(AgendaApp, {
        initialData: {
          user: { name: "Alice" },
          baseDate: "2026-10-21",
          events: [
            {
              title: "<script>alert(1)</script>",
              start: "2026-10-21T02:00:00.000Z",
              end: "2026-10-21T03:00:00.000Z",
              meetingUrl: "https://meet.google.com/abc-defg-hij",
            },
            {
              title: "Company Holiday",
              start: "2026-10-21",
              end: "2026-10-22",
            },
          ],
        },
      }),
    );
    expect(agendaHtml).toContain('data-slot="card"');
    expect(agendaHtml).toContain('data-slot="badge"');
    expect(agendaHtml).toContain('aria-label="Toggle theme"');
    expect(agendaHtml).toContain('aria-label="Sync data"');
    expect(agendaHtml).toContain("Calendar Agenda · Alice");
    expect(agendaHtml).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(agendaHtml).toContain("Join Meet");
    expect(agendaHtml).toContain("All day");
    expect(agendaHtml).not.toContain("Upcoming");
    expect(agendaHtml).toContain('data-timeline-hour="12:00"');
    expect(agendaHtml).toContain('data-break-hour="true"');
    expect(agendaHtml).toContain("12:00 – 13:00 · Break");
    expect(agendaHtml).not.toContain("All Days");

    const multiDayAgendaHtml = renderToString(
      React.createElement(AgendaApp, {
        initialData: {
          user: { name: "Alice" },
          baseDate: "2026-10-21",
          events: [
            {
              title: "Daily Meeting Sync",
              start: "2026-10-21T02:00:00.000Z",
              end: "2026-10-21T03:00:00.000Z",
            },
            {
              title: "Quick Check-in",
              start: "2026-10-21T04:00:00.000Z",
              end: "2026-10-21T04:15:00.000Z",
            },
            {
              title: "Day Two Review",
              start: "2026-10-22T02:00:00.000Z",
              end: "2026-10-22T03:00:00.000Z",
            },
          ],
        },
      }),
    );
    expect(multiDayAgendaHtml).toContain('data-slot="agenda-pagination"');
    expect(multiDayAgendaHtml).toContain('aria-label="Previous day"');
    expect(multiDayAgendaHtml).toContain('aria-label="Next day"');
    expect(multiDayAgendaHtml).not.toContain("All Days");
    expect(multiDayAgendaHtml).toContain("Daily Mee...");
    expect(multiDayAgendaHtml).not.toContain("Day Two Review");

    expect(formatTimelineBlockLabel("Daily Meeting", 2.5)).toBe("");
    expect(formatTimelineBlockLabel("Daily Meeting", 10)).toBe("Daily Mee...");
    expect(formatTimelineBlockLabel("Sync", 10)).toBe("Sync");

    const scheduleHtml = renderToString(
      React.createElement(ScheduleApp, {
        initialData: {
          currentUser: {
            name: "User 1",
            email: "user1@example.com",
            busy: [
              {
                start: "2026-10-21T01:00:00.000Z",
                end: "2026-10-21T01:45:00.000Z",
              },
            ],
          },
          allAttendees: [
            {
              name: "User 2",
              email: "user2@example.com",
              busy: [
                {
                  start: "2026-10-21T03:00:00.000Z",
                  end: "2026-10-21T04:00:00.000Z",
                },
              ],
            },
            { name: "User 3", email: "user3@example.com" },
            { name: "User 4", email: "user4@example.com" },
            { name: "User 5", email: "user5@example.com" },
            { name: "User 6", email: "user6@example.com" },
          ],
          dateStr: "2026-10-21",
          durationMinutes: 30,
          rooms: [
            {
              id: "r-small",
              name: "Phone Booth",
              email: "booth@example.com",
              capacity: 2,
            },
            {
              id: "r-fit",
              name: "Hanoi Pod",
              email: "pod@example.com",
              capacity: 6,
            },
            {
              id: "r-large",
              name: "Boardroom",
              email: "board@example.com",
              capacity: 12,
            },
          ],
          mutualSlots: [
            {
              start: "2026-10-21T02:00:00.000Z",
              end: "2026-10-21T02:30:00.000Z",
            },
            {
              start: "2026-10-21T05:00:00.000Z",
              end: "2026-10-21T05:30:00.000Z",
            },
          ],
        },
      }),
    );
    expect(scheduleHtml).toContain('data-slot="card"');
    expect(scheduleHtml).toContain('aria-label="Toggle theme"');
    expect(scheduleHtml).toContain('aria-label="Sync data"');
    expect(scheduleHtml).toContain(
      "User 1, User 2, User 3, User 4, User 5 &amp; User 6",
    );
    expect(scheduleHtml).toContain('data-calendar-column="User 1"');
    expect(scheduleHtml).toContain('data-calendar-column="User 2"');
    expect(scheduleHtml).toContain('data-slot="avatar"');
    expect(scheduleHtml).toContain('data-slot="select-trigger"');
    expect(scheduleHtml).toContain('data-bottom-timeline-hours="true"');
    expect(scheduleHtml).not.toContain("THIS FEATURE WAS REMOVED FOR HOI");
    expect(scheduleHtml).toContain('data-room-row="true"');
    expect(scheduleHtml).toContain("Hanoi Pod");
    expect(scheduleHtml).toContain('aria-label="Meeting duration"');
    expect(scheduleHtml).not.toContain("Best fit (6p)");
    expect(scheduleHtml).toContain("Busy");
    expect(scheduleHtml).toContain("People / Timeline");
    expect(scheduleHtml).toContain("Common Free");
    expect(scheduleHtml).toContain('data-break-slot="true"');

    // When attendees exceed all room capacities, default to Google Meet (no room selected)
    const oversizeScheduleHtml = renderToString(
      React.createElement(ScheduleApp, {
        initialData: {
          currentUser: { name: "User 1", email: "user1@example.com" },
          allAttendees: [
            { name: "User 2", email: "user2@example.com" },
            { name: "User 3", email: "user3@example.com" },
          ],
          dateStr: "2026-10-21",
          durationMinutes: 30,
          rooms: [
            {
              id: "r-small",
              name: "Phone Booth",
              email: "booth@example.com",
              capacity: 2,
            },
          ],
          mutualSlots: [
            {
              start: "2026-10-21T02:00:00.000Z",
              end: "2026-10-21T02:30:00.000Z",
            },
          ],
        },
      }),
    );
    expect(oversizeScheduleHtml).toContain("No room (Google Meet)");
    expect(oversizeScheduleHtml).not.toContain('data-room-row="true"');
    expect(oversizeScheduleHtml).not.toContain(
      'data-bottom-timeline-hours="true"',
    );

    const tasksHtml = renderToString(
      React.createElement(TaskBoardApp, {
        initialData: {
          teamName: "Core",
          projectName: "MCP v2",
          tasks: [
            {
              id: "t1",
              title: "Build Kanban",
              status: "todo",
              priority: "high",
            },
          ],
        },
      }),
    );
    expect(tasksHtml).toContain('data-slot="card"');
    expect(tasksHtml).toContain('aria-label="Toggle theme"');
    expect(tasksHtml).toContain('aria-label="Sync data"');
    expect(tasksHtml).toContain('aria-label="Hide Done column"');
    expect(tasksHtml).toContain('aria-label="Show Cancelled column"');
    expect(tasksHtml).toContain("Core · MCP v2");
    expect(tasksHtml).toContain('draggable="true"');
    expect(tasksHtml).toContain("Cancelled");
    expect(tasksHtml).toContain("max-h-[440px]");
    expect(tasksHtml).toContain("overflow-y-auto");
    // Unstarted task in todo should not render timer or empty progress bar
    expect(tasksHtml).not.toContain('data-testid="task-timer"');
    expect(tasksHtml).not.toContain('data-testid="task-progress"');

    const booked = [
      { start: "2026-10-21T02:00:00.000Z", end: "2026-10-21T02:30:00.000Z" },
    ];
    expect(
      isIntervalBusy(
        booked,
        "2026-10-21T02:15:00.000Z",
        "2026-10-21T02:45:00.000Z",
      ),
    ).toBe(true);
    expect(
      isIntervalBusy(
        booked,
        "2026-10-21T02:30:00.000Z",
        "2026-10-21T03:00:00.000Z",
      ),
    ).toBe(false);
    expect(
      getRoomBusyIntervals(
        { id: "r2", name: "R2", email: "r2@example.com", busy: [] },
        null,
        [],
      ),
    ).toEqual([]);

    // Room busy intervals are exact (never stretched by candidate slot duration) and block any slot where a meeting starts or ends inside it
    const roomMeeting = {
      id: "r-bangkok",
      name: "Bangkok",
      email: "bangkok@example.com",
      busy: [
        { start: "2026-10-21T03:00:00.000Z", end: "2026-10-21T04:00:00.000Z" },
      ],
    };
    const expanded = expandTo15MinSlots(
      [
        { start: "2026-10-21T02:30:00.000Z", end: "2026-10-21T03:00:00.000Z" },
        { start: "2026-10-21T04:00:00.000Z", end: "2026-10-21T04:30:00.000Z" },
      ],
      30,
      [],
    );
    expect(getRoomBusyIntervals(roomMeeting, null, expanded)).toEqual(
      roomMeeting.busy,
    );
    // Meeting starting at 03:00 blocks 02:45-03:15; meeting ending at 04:00 blocks 03:45-04:15; touching boundaries 02:30-03:00 and 04:00-04:30 remain free
    expect(
      isRoomBusyAt(
        roomMeeting,
        null,
        "2026-10-21T02:45:00.000Z",
        "2026-10-21T03:15:00.000Z",
      ),
    ).toBe(true);
    expect(
      isRoomBusyAt(
        roomMeeting,
        null,
        "2026-10-21T03:45:00.000Z",
        "2026-10-21T04:15:00.000Z",
      ),
    ).toBe(true);
    expect(
      isRoomBusyAt(
        roomMeeting,
        null,
        "2026-10-21T02:30:00.000Z",
        "2026-10-21T03:00:00.000Z",
      ),
    ).toBe(false);
    expect(
      isRoomBusyAt(
        roomMeeting,
        null,
        "2026-10-21T04:00:00.000Z",
        "2026-10-21T04:30:00.000Z",
      ),
    ).toBe(false);
  });
});
