"use client";

import * as React from "react";
import Link from "next/link";
import { Bot, MessageSquareText, Timer } from "lucide-react";

export function LandingProcessSteps() {
  return (
    <section
      className="relative"
      id="process-area"
      data-container="process-area"
    >
      <div className="container">
        <div className="border-container section-spacing-lg sticky-cards">
          <div className="flex items-start justify-between gap-10 relative flex-col md:flex-row process-wrapper">
            <div className="max-w-[520px] md:max-w-[560px] w-full">
              <div className="sticky-card">
                <span className="badge-button mb-3 inline-block">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5" />
                  Collaborative Productivity
                </span>
                <h2
                  data-title=""
                  className="text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] font-semibold -tracking-[0.4px] !leading-[1.12] text-[#18181b] dark:text-[#fbfbfb]"
                >
                  Collaboration That Moves at the Speed of Thought
                </h2>
                <p
                  data-excerpt=""
                  className="mt-4 md:mt-5 text-[#52525b] dark:text-[#a1a1aa] text-sm sm:text-base leading-relaxed"
                >
                  Say goodbye to scattered Slack messages and disconnected Jira
                  tickets. Keep discussions attached to deliverables, log
                  focused deep work with sub-second timers, and leverage Model
                  Context Protocol (MCP) to automate project management.
                </p>
                <div className="mt-8">
                  <Link
                    prefetch={false}
                    href="/tasks"
                    className="button-primary inline-flex items-center justify-center px-6 py-3.5 font-medium text-sm rounded-full cursor-pointer"
                  >
                    See Task Workflow in Action
                  </Link>
                </div>
              </div>
            </div>
            <div
              className="md:max-w-[560px] w-full flex flex-col gap-6"
              data-card=""
            >
              {/* Process Card 1: Comment & Interactive Collaboration */}
              <div className="sticky-card relative z-10">
                <div className="feature-card rounded-[16px] px-5 pt-5 pb-5 md:pb-10">
                  <div className="flex items-center justify-between gap-5">
                    <div className="icon-tile-solid w-11 h-11 flex items-center justify-center rounded-[10px]">
                      <MessageSquareText className="size-5" />
                    </div>
                    <span className="py-1.5 px-3 text-xs sm:text-sm font-medium text-xs sm:text-sm leading-normal tracking-[-0.1px] rounded-full inline-block bg-[#f4f4f5] dark:bg-[#26262b] border border-[#e4e4e7] dark:border-[#27272a] text-[#52525b] dark:text-[#a1a1aa]">
                      01. Contextual Threads
                    </span>
                  </div>
                  <h3 className="text-xl text-[#18181b] dark:text-[#fbfbfb] font-medium leading-normal mt-7.5">
                    Inline Discussions &amp; Team Context
                  </h3>
                  <div className="my-4 gradient-border w-full h-[1px]"></div>
                  <p className="text-[#52525b] dark:text-[#a1a1aa] text-sm sm:text-base leading-relaxed">
                    Collaborate directly inside every task card. Leave threaded
                    comments, attach design specs, tag teammates, and unblock
                    progress without leaving your flow state.
                  </p>
                </div>
              </div>

              {/* Process Card 2: Live Time-Tracking */}
              <div className="sticky-card relative z-20">
                <div className="feature-card rounded-[16px] px-5 pt-5 pb-5 md:pb-10">
                  <div className="flex items-center justify-between gap-5">
                    <div className="icon-tile-solid w-11 h-11 flex items-center justify-center rounded-[10px]">
                      <Timer className="size-5" />
                    </div>
                    <span className="py-1.5 px-3 text-xs sm:text-sm font-medium text-xs sm:text-sm leading-normal tracking-[-0.1px] rounded-full inline-block bg-[#f4f4f5] dark:bg-[#26262b] border border-[#e4e4e7] dark:border-[#27272a] text-[#52525b] dark:text-[#a1a1aa]">
                      02. Focus Tracking
                    </span>
                  </div>
                  <h3 className="text-xl text-[#18181b] dark:text-[#fbfbfb] font-medium leading-normal mt-7.5">
                    Sub-Second Precision &amp; Velocity Timers
                  </h3>
                  <div className="my-4 gradient-border w-full h-[1px]"></div>
                  <p className="text-[#52525b] dark:text-[#a1a1aa] text-sm sm:text-base leading-relaxed">
                    Track real-time deep-work sessions with active sub-second
                    precision. Contrast actual hours against initial estimates,
                    prevent burnout, and gain actionable team velocity insights.
                  </p>
                </div>
              </div>

              {/* Process Card 3: AI & MCP Management */}
              <div className="sticky-card relative z-30">
                <div className="feature-card rounded-[16px] px-5 pt-5 pb-5 md:pb-10">
                  <div className="flex items-center justify-between gap-5">
                    <div className="icon-tile-solid w-11 h-11 flex items-center justify-center rounded-[10px]">
                      <Bot className="size-5" />
                    </div>
                    <span className="py-1.5 px-3 text-xs sm:text-sm font-medium text-xs sm:text-sm leading-normal tracking-[-0.1px] rounded-full inline-block bg-[#f4f4f5] dark:bg-[#26262b] border border-[#e4e4e7] dark:border-[#27272a] text-[#52525b] dark:text-[#a1a1aa]">
                      03. MCP Protocol
                    </span>
                  </div>
                  <h3 className="text-xl text-[#18181b] dark:text-[#fbfbfb] font-medium leading-normal mt-7.5">
                    Autonomous Sprint &amp; Task Triage via MCP
                  </h3>
                  <div className="my-4 gradient-border w-full h-[1px]"></div>
                  <p className="text-[#52525b] dark:text-[#a1a1aa] text-sm sm:text-base leading-relaxed">
                    Empower coding assistants (Claude Desktop, Cursor, Windsurf)
                    to create backlog items, update progress columns, and triage
                    sprints autonomously via Scylla&apos;s standard MCP server.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <section className="process-end md:h-[150px]"></section>
        </div>
      </div>
    </section>
  );
}
