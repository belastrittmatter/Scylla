"use client";

import * as React from "react";
import Link from "next/link";
import { CornerTicks } from "@/components/landing/corner-ticks";
import {
  Bot,
  CalendarCheck2,
  CalendarPlus,
  FolderGit2,
  RefreshCw,
  Send,
} from "lucide-react";

interface UseCaseItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  link: string;
  tag: string;
}

const USE_CASES: UseCaseItem[] = [
  {
    icon: CalendarCheck2,
    title: "People & Conference Room Availability",
    description:
      "Check real-time free/busy slots across team members and physical meeting rooms. Eliminate scheduling conflicts automatically before booking.",
    link: "/calendar",
    tag: "Availability",
  },
  {
    icon: CalendarPlus,
    title: "Effortless Event & Meeting Creation",
    description:
      "Create 1-on-1s, team check-ins, or sprint reviews in seconds with customized duration presets, buffer times, and recurring rules.",
    link: "/calendar",
    tag: "Scheduling",
  },
  {
    icon: RefreshCw,
    title: "Two-Way Google Calendar Sync",
    description:
      "Full bi-directional synchronization ensures meetings booked in Google Calendar or Scylla reflect instantly across all your devices.",
    link: "/calendar",
    tag: "2-Way Sync",
  },
  {
    icon: FolderGit2,
    title: "Project-Linked Meeting Context",
    description:
      "Connect calendar meetings directly to specific projects and task boards, keeping discussions, action items, and deliverables unified.",
    link: "/tasks",
    tag: "Projects",
  },
  {
    icon: Send,
    title: "Seamless Meeting Invites & Video Links",
    description:
      "Share personalized booking links, automatically generate Google Meet or Zoom conference rooms, and manage attendee confirmations.",
    link: "/calendar",
    tag: "Invites",
  },
  {
    icon: Bot,
    title: "Autonomous Meeting Booking via MCP",
    description:
      "Allow AI agents to query colleague availability, resolve multi-party schedule overlaps, and book confirmed meeting rooms using MCP tools.",
    link: "/calendar",
    tag: "AI & MCP",
  },
];

export function LandingUseCases() {
  return (
    <section className="relative">
      <div className="container">
        <div className="border-container section-spacing-lg">
          {/* Section Title */}
          <div
            className="max-w-[450px] sm:max-w-[540px] lg:max-w-[650px] mx-auto text-center mb-10 sm:mb-12 md:mb-16 xl:mb-20"
            data-section-title=""
          >
            <span className="badge-button mb-5" data-subtitle="">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5" />
              Smart Calendar Capabilities
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] !leading-[1.2] font-semibold -tracking-[0.4px] text-[#18181b] dark:text-[#fbfbfb] overflow-hidden"
              data-title=""
            >
              Built for Modern Productive Teams
            </h2>
            <p
              className="mt-4 md:mt-5 text-[#52525b] dark:text-[#a1a1aa] overflow-hidden"
              data-excerpt=""
            >
              Experience an intelligent scheduling engine designed to eliminate
              meeting friction, sync with Google Calendar, and automate
              availability coordination via AI.
            </p>
          </div>

          {/* Hairline capability table with corner ticks */}
          <div
            className="hairline-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px relative"
            data-sttr-wrapper=""
          >
            <CornerTicks />
            {USE_CASES.map((item, index) => {
              const IconComp = item.icon;
              return (
                <div key={index} data-sttr-card="" className="relative">
                  <Link
                    prefetch={false}
                    className="feature-card block cursor-pointer rounded-none border-0 border-[#e4e4e7] dark:border-[#27272a] !border-b-0 h-full px-6 pt-6 pb-8 transition-shadow"
                    href={item.link}
                  >
                    <div className="flex items-center justify-between gap-5">
                      <div className="icon-tile w-11 h-11 flex items-center justify-center rounded-[10px]">
                        <IconComp className="size-5" />
                      </div>
                      <div className="py-1 px-2.5 bg-[#f4f4f5] dark:bg-[#26262b] border border-[#e4e4e7] dark:border-[#27272a] rounded-full text-[11px] font-medium text-[#52525b] dark:text-[#a1a1aa]">
                        {item.tag}
                      </div>
                    </div>
                    <h3 className="text-xl text-[#18181b] dark:text-[#fbfbfb] font-medium leading-normal mt-7.5">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-[#52525b] dark:text-[#a1a1aa] text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
