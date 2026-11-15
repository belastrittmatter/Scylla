"use client";

import * as React from "react";
import Link from "next/link";
import { CornerTicks } from "@/components/landing/corner-ticks";

const ACTIVITY_LINES: Array<Array<{ text: string; tone?: "ok" | "hl" | "" }>> =
  [
    [
      { text: "$ ", tone: "hl" },
      { text: "resolve_user ", tone: "" },
      { text: '"nick"', tone: "" },
    ],
    [{ text: "→ marcus.vance@team.dev · Admin", tone: "" }],
    [
      { text: "$ ", tone: "hl" },
      { text: "find_common_meeting_slots ", tone: "" },
      { text: "attendees=4 week=next", tone: "" },
    ],
    [
      {
        text: "→ 3 mutual slots · Thu 14:00 · Fri 10:30 · Fri 16:00",
        tone: "",
      },
    ],
    [
      { text: "$ ", tone: "hl" },
      { text: "book_meeting ", tone: "" },
      { text: "room=focus-room-alpha time=thu-14:00", tone: "" },
    ],
    [{ text: "✓ Focus Room Alpha confirmed · invites sent", tone: "ok" }],
  ];

export function LandingIntegrations() {
  return (
    <section className="relative">
      <div className="container">
        <div className="border-container section-spacing-lg">
          <div
            className="hairline-grid grid grid-cols-1 lg:grid-cols-2 gap-px relative"
            data-container="apps-section"
          >
            <CornerTicks />

            {/* Content cell */}
            <div className="relative">
              <div className="h-full px-6 sm:px-9 py-10 sm:py-14 lg:py-[90px] flex flex-col justify-center">
                <span className="badge-button mb-3 inline-block self-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5" />
                  Model Context Protocol
                </span>
                <h3
                  data-title=""
                  className="!leading-[1.2] text-3xl md:text-4xl lg:text-5xl xl:text-[51px] font-semibold text-[#18181b] dark:text-[#fbfbfb]"
                >
                  Connect Scylla to Any AI Agent &amp; Workflow Stack
                </h3>
                <p
                  data-excerpt=""
                  className="mt-4 sm:mt-5 text-[#52525b] dark:text-[#a1a1aa] text-sm sm:text-base leading-relaxed max-w-[560px]"
                >
                  Seamlessly bridge Scylla via standard Model Context Protocol
                  (MCP) to leading AI agents—including Claude Desktop, Cursor,
                  Windsurf, ChatGPT, Gemini, Copilot, and Cline. Empower your AI
                  assistants to query colleague calendars, book meeting rooms,
                  track active time, and organize project backlogs directly from
                  your coding workspace.
                </p>
                <div
                  data-button=""
                  className="mt-6 sm:mt-8 lg:mt-9 flex flex-wrap gap-4"
                >
                  <Link
                    prefetch={false}
                    className="button-primary inline-flex items-center justify-center px-[22px] py-3 font-medium text-sm leading-normal rounded-full text-center cursor-pointer"
                    href="/tasks"
                  >
                    Explore MCP Integration
                  </Link>
                  <Link
                    prefetch={false}
                    className="button-secondary cursor-pointer !py-3 px-5 text-sm"
                    href="/calendar"
                  >
                    View Calendar Tools
                  </Link>
                </div>
              </div>
            </div>

            {/* Solid orange contrast cell with a live agent-run terminal card */}
            <div
              data-thumbnail=""
              className="solid-orange relative flex items-center justify-center p-8 sm:p-12 lg:p-16"
            >
              <div
                className="activity-card relative z-1 w-full max-w-[460px] p-5 sm:p-6"
                data-activity-card=""
              >
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="activity-line !text-sm !text-white">
                      mcp run — scylla agent
                    </span>
                  </div>
                  <span className="activity-line !text-xs text-white/40">
                    stream-http
                  </span>
                </div>
                <div className="pt-4 flex flex-col gap-1">
                  {ACTIVITY_LINES.map((line, index) => (
                    <div
                      key={index}
                      className="activity-line"
                      data-activity-line=""
                    >
                      {line.map((part, partIndex) => (
                        <span key={partIndex} className={part.tone || ""}>
                          {part.text}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
