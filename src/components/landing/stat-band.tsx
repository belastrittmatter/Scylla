"use client";

import * as React from "react";
import { CornerTicks } from "@/components/landing/corner-ticks";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  description: string;
}

const STATS: StatItem[] = [
  {
    value: 33,
    suffix: "",
    label: "MCP tools",
    description:
      "Agents query availability, resolve nicknames, book rooms, and manage tasks through the standard Model Context Protocol.",
  },
  {
    value: 15,
    suffix: "-min",
    label: "slot granularity",
    description:
      "Mutual free slots are scanned in 15-minute steps across every attendee's own working hours and timezone.",
  },
  {
    value: 2,
    suffix: "-way",
    label: "calendar sync",
    description:
      "Full bidirectional sync with Google Calendar — meetings booked anywhere reflect everywhere, instantly.",
  },
];

/**
 * Cloudflare-style bordered stat band: oversized figures with hairline
 * table structure and corner ticks. Numbers count up on first reveal.
 */
export function LandingStatBand() {
  return (
    <section className="relative" data-stat-band="">
      <div className="container">
        <div className="border-container py-8 sm:py-10">
          <div
            className="hairline-grid grid grid-cols-1 lg:grid-cols-3 gap-px relative"
            data-sttr-wrapper=""
          >
            <CornerTicks />
            {STATS.map((stat) => (
              <div key={stat.label} data-sttr-card="" className="relative">
                <div className="px-7 py-10 md:py-14 flex flex-col h-full">
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-6xl sm:text-7xl font-medium text-[#18181b] dark:text-[#fbfbfb] tracking-[-0.03em] tabular-nums"
                      data-count={stat.value}
                    >
                      {stat.value}
                    </span>
                    <span className="text-2xl font-medium text-[#ea580c]">
                      {stat.suffix}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-[#18181b] dark:text-[#fbfbfb]">
                    {stat.label}
                  </h3>
                  <p className="mt-3 text-[#52525b] dark:text-[#a1a1aa] text-sm leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
