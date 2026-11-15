"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { CornerTicks } from "@/components/landing/corner-ticks";

const LiveScheduleApp = dynamic(
  () => import("@/components/mcp-ui/schedule-app").then((m) => m.ScheduleApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[220px] items-center justify-center bg-[#121215] rounded-xl text-xs text-neutral-400">
        loading live schedule…
      </div>
    ),
  },
);

// Demo payloads for the live MCP cards (the bridge resolves instantly
// with these instead of waiting on a server connection).
const MOCK_SCHEDULE_DATA = {
  currentUser: { name: "Alex Rivera", email: "alex@scylla.so" },
  targetUser: { name: "Olivia Chen", email: "olivia@scylla.so" },
  allAttendees: ["Olivia Chen"],
  dateStr: "2026-11-20",
  durationMinutes: 45,
  mutualSlots: [
    { start: "2026-11-20T09:00:00+07:00", end: "2026-11-20T09:45:00+07:00" },
    { start: "2026-11-20T10:30:00+07:00", end: "2026-11-20T11:15:00+07:00" },
    { start: "2026-11-20T14:00:00+07:00", end: "2026-11-20T14:45:00+07:00" },
  ],
  rooms: [
    {
      id: "room-focus-alpha",
      name: "Focus Room Alpha",
      email: "focus-room-alpha@scylla.so",
      capacity: 8,
      officeLocation: "HCMC",
    },
  ],
  suggestedTitle: "Sprint Review",
  suggestedAgenda: "Weekly demo + Q4 planning checkpoint",
};

const MOCK_AGENDA_DATA = {
  user: { name: "Alex Rivera", email: "alex@scylla.so" },
  baseDate: "2026-11-20",
  events: [
    {
      id: "ev-1",
      title: "Daily Standup",
      start: "2026-11-20T09:00:00+07:00",
      end: "2026-11-20T09:15:00+07:00",
    },
    {
      id: "ev-2",
      title: "Deep Work — Pricing Engine",
      start: "2026-11-20T10:00:00+07:00",
      end: "2026-11-20T12:00:00+07:00",
    },
    {
      id: "ev-3",
      title: "Sprint Review",
      start: "2026-11-20T14:00:00+07:00",
      end: "2026-11-20T15:00:00+07:00",
      meetingUrl: "https://meet.google.com/demo-scylla",
    },
  ],
};

const LiveAgendaApp = dynamic(
  () => import("@/components/mcp-ui/agenda-app").then((m) => m.AgendaApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[220px] items-center justify-center bg-[#121215] rounded-xl text-xs text-neutral-400">
        loading live agenda…
      </div>
    ),
  },
);

interface CalendarFeature {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageHeightClass: string;
  live?: boolean;
  liveKey?: "schedule" | "agenda";
}

const ROW_ONE_FEATURES: CalendarFeature[] = [
  {
    title: "Unified Visual Time-Blocking",
    description:
      "Drag pending backlog tasks directly onto your hourly calendar timeline. Lock in focused deep work blocks with automatic duration snapping and live status updates.",
    imageSrc: "/images/calendar/why-chose-01.jpg",
    imageAlt: "Visual drag and drop time blocking on Scylla Calendar",
    imageHeightClass: "h-[300px] sm:h-[370px] lg:h-[420px]",
    live: true,
    liveKey: "schedule",
  },
  {
    title: "Instant Two-Way Calendar Sync",
    description:
      "Real-time bidirectional sync with Google Calendar and Microsoft Outlook. Any change made in Scylla or external apps reflects instantly with zero lag.",
    imageSrc: "/images/calendar/why-chose-02.png",
    imageAlt: "Real-time two-way sync with Google Calendar and Outlook",
    imageHeightClass: "h-[300px] sm:h-[370px] lg:h-[420px]",
  },
];

const ROW_TWO_FEATURES: CalendarFeature[] = [
  {
    title: "Team Availability Overlay",
    description:
      "Layer teammates' schedules to spot mutual free slots instantly without asking around or comparing multiple calendars.",
    imageSrc: "/images/calendar/why-chose-03.jpg",
    imageAlt: "Team availability overlay showing mutual free slots",
    imageHeightClass: "h-[220px] sm:h-[260px] md:h-[280px]",
    live: true,
    liveKey: "agenda",
  },
  {
    title: "Project-Linked Meetings",
    description:
      "Link calendar events directly to active workspace projects. Access meeting agendas, client deliverables, and auto-assigned tasks in one place.",
    imageSrc: "/images/calendar/why-chose-04.png",
    imageAlt:
      "Project-linked meetings connecting calendar events to deliverables",
    imageHeightClass: "h-[220px] sm:h-[260px] md:h-[280px]",
  },
  {
    title: "1-Click Booking Links",
    description:
      "Share your custom availability link with clients. Guests select an open slot, and Scylla handles meeting room creation and calendar invites automatically.",
    imageSrc: "/images/calendar/why-chose-05.jpg",
    imageAlt:
      "Personalized 1-click booking link widget with Google Meet generation",
    imageHeightClass: "h-[220px] sm:h-[260px] md:h-[280px]",
  },
];

function FeatureCell({ feature }: { feature: CalendarFeature }) {
  return (
    <div data-sttr-card="" className="relative">
      <div className="h-full flex flex-col p-6 md:p-7">
        {/* Feature Preview — live MCP card or screenshot */}
        <div
          className={`overflow-hidden rounded-xl border border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#18181b] ${feature.imageHeightClass} w-full shrink-0 ${feature.live ? "dark" : ""}`}
        >
          {feature.live ? (
            <div className="h-full w-full [&>*]:h-full [&>*]:w-full">
              {feature.liveKey === "schedule" ? (
                <LiveScheduleApp initialData={MOCK_SCHEDULE_DATA} />
              ) : (
                <LiveAgendaApp initialData={MOCK_AGENDA_DATA} />
              )}
            </div>
          ) : (
            <img
              className="w-full h-full object-cover object-center select-none"
              src={feature.imageSrc}
              alt={feature.imageAlt}
              loading="lazy"
            />
          )}
        </div>

        {/* Feature Content */}
        <div className="pt-5 flex-1 flex flex-col">
          <h3 className="text-xl !leading-tight font-medium text-[#18181b] dark:text-[#fbfbfb] min-h-[2.75rem] flex items-center">
            {feature.title}
          </h3>
          <p className="mt-3 text-[#52525b] dark:text-[#a1a1aa] text-sm sm:text-base leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Calendar() {
  return (
    <section
      className="relative"
      id="calendar-features"
      data-container="calendar-features"
    >
      <div className="container">
        <div className="border-container section-spacing-lg">
          {/* Section Header */}
          <div
            className="max-w-[500px] sm:max-w-[580px] lg:max-w-[700px] mx-auto text-center mb-10 sm:mb-12 md:mb-16 xl:mb-20"
            data-section-title=""
          >
            <span className="badge-button mb-5" data-subtitle="">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5" />
              Scylla Smart Calendar
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] !leading-[1.2] font-semibold -tracking-[0.4px] text-[#18181b] dark:text-[#fbfbfb]"
              data-title=""
            >
              Visual Scheduling Designed for Deep Work
            </h2>
            <p
              className="mt-4 md:mt-5 text-[#52525b] dark:text-[#a1a1aa] text-sm sm:text-base lg:text-lg"
              data-excerpt=""
            >
              Connect your tasks directly to your timeline. Say goodbye to
              fragmented apps, double bookings, and endless schedule
              coordination.
            </p>
          </div>

          {/* Hairline bento table with corner ticks */}
          <div className="flex flex-col gap-6">
            {/* Row 1: 2 cells */}
            <div
              className="hairline-grid grid sm:grid-cols-2 gap-px relative"
              data-sttr-wrapper=""
            >
              <CornerTicks />
              {ROW_ONE_FEATURES.map((feature) => (
                <FeatureCell key={feature.title} feature={feature} />
              ))}
            </div>

            {/* Row 2: 3 cells */}
            <div
              className="hairline-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-px relative"
              data-sttr-wrapper=""
            >
              <CornerTicks />
              {ROW_TWO_FEATURES.map((feature) => (
                <FeatureCell key={feature.title} feature={feature} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Calendar;
