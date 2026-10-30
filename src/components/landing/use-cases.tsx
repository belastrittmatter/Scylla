"use client";

import * as React from "react";
import Link from "next/link";
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
    <section className="section-bottom-border bg-[#09090b]">
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
              className="gradient-text text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] !leading-[1.2] font-semibold -tracking-[0.4px] overflow-hidden"
              data-title=""
            >
              Built for Modern Productive Teams
            </h2>
            <p
              className="mt-4 md:mt-5 text-offWhite/80 overflow-hidden"
              data-excerpt=""
            >
              Experience an intelligent scheduling engine designed to eliminate
              meeting friction, sync with Google Calendar, and automate
              availability coordination via AI.
            </p>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            data-sttr-wrapper=""
          >
            {USE_CASES.map((item, index) => {
              const IconComp = item.icon;
              return (
                <div
                  key={index}
                  className="px-5 pt-5 pb-6 md:pb-10 bg-blue rounded-20 border border-lineColor/70 relative group border-moving before:rounded-xl sm:before:rounded-2xl lg:before:rounded-[20px] z-1 useCase-card transition-all duration-300 hover:border-white/30"
                  data-sttr-card=""
                >
                  {/* NOTE: Must use window.location.replace instead of Next.js client-side navigation because Next.js caches CSS across route transitions, causing style conflicts when entering the dashboard. */}
                  <Link
                    className="block cursor-pointer"
                    href={item.link}
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.replace(item.link);
                    }}
                  >
                    <div className="flex items-center justify-between gap-5">
                      <div className="w-11 h-11 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded-[10px]">
                        <IconComp className="size-5 text-orange-400" />
                      </div>

                      <div className="py-1 px-2.5 bg-white/5 border border-white/10 rounded-[8px] text-[11px] font-mono text-neutral-400 group-hover:text-white group-hover:border-white/20 transition-colors">
                        {item.tag}
                      </div>
                    </div>
                    <h3 className="text-xl text-offWhite font-medium leading-normal mt-7.5">
                      {item.title}
                    </h3>
                    <div className="my-4 gradient-border w-full h-[1px]"></div>
                    <p className="text-offWhite/60 text-sm leading-relaxed">
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
export { LandingUseCases as UseCases };
