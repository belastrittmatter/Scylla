"use client";

import * as React from "react";
import Link from "next/link";
import { Bot, MessageSquareText, Timer } from "lucide-react";

export function LandingProcessSteps() {
  return (
    <section
      className="section-bottom-border bg-[#09090b]"
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
                  className="gradient-text text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] font-semibold -tracking-[0.4px] !leading-[1.12]"
                >
                  Collaboration That Moves at the Speed of Thought
                </h2>
                <p
                  data-excerpt=""
                  className="mt-4 md:mt-5 text-offWhite/80 text-sm sm:text-base leading-relaxed"
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
                    className="button-primary inline-flex items-center justify-center px-6 py-3.5 text-white font-medium text-sm rounded-[10px] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all cursor-pointer"
                  >
                    See Task Workflow in Action
                  </Link>
                </div>
              </div>
            </div>
            <div
              className="md:max-w-[560px] w-full flex flex-col gap-5"
              data-card=""
            >
              {/* Process Card 1: Comment & Interactive Collaboration */}
              <div className="sticky-card relative z-10">
                <div className="px-5 pt-5 pb-5 md:pb-10 bg-blue rounded-[20px] border border-lineColor/70 transition-all duration-300 hover:border-white/30">
                  <div className="flex items-center justify-between gap-5">
                    <div className="w-11 h-11 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded-[10px]">
                      <MessageSquareText className="size-5 text-orange-400" />
                    </div>
                    <span className="py-1.5 px-3 text-xs sm:text-sm font-medium leading-normal tracking-[-0.1px] rounded-[10px] inline-block bg-white/5 border border-white/10 text-neutral-300 font-mono">
                      01. Contextual Threads
                    </span>
                  </div>
                  <h3 className="text-xl text-offWhite font-medium leading-normal mt-7.5">
                    Inline Discussions &amp; Team Context
                  </h3>
                  <div className="my-4 gradient-border w-full h-[1px]"></div>
                  <p className="text-offWhite/60 text-sm sm:text-base leading-relaxed">
                    Collaborate directly inside every task card. Leave threaded
                    comments, attach design specs, tag teammates, and unblock
                    progress without leaving your flow state.
                  </p>
                </div>
              </div>

              {/* Process Card 2: Live Time-Tracking */}
              <div className="sticky-card relative z-20">
                <div className="px-5 pt-5 pb-5 md:pb-10 bg-blue rounded-[20px] border border-lineColor/70 transition-all duration-300 hover:border-white/30">
                  <div className="flex items-center justify-between gap-5">
                    <div className="w-11 h-11 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded-[10px]">
                      <Timer className="size-5 text-orange-400" />
                    </div>
                    <span className="py-1.5 px-3 text-xs sm:text-sm font-medium leading-normal tracking-[-0.1px] rounded-[10px] inline-block bg-white/5 border border-white/10 text-neutral-300 font-mono">
                      02. Focus Tracking
                    </span>
                  </div>
                  <h3 className="text-xl text-offWhite font-medium leading-normal mt-7.5">
                    Sub-Second Precision &amp; Velocity Timers
                  </h3>
                  <div className="my-4 gradient-border w-full h-[1px]"></div>
                  <p className="text-offWhite/60 text-sm sm:text-base leading-relaxed">
                    Track real-time deep-work sessions with active sub-second
                    precision. Contrast actual hours against initial estimates,
                    prevent burnout, and gain actionable team velocity insights.
                  </p>
                </div>
              </div>

              {/* Process Card 3: AI & MCP Management */}
              <div className="sticky-card relative z-30">
                <div className="px-5 pt-5 pb-5 md:pb-10 bg-blue rounded-[20px] border border-lineColor/70 transition-all duration-300 hover:border-white/30">
                  <div className="flex items-center justify-between gap-5">
                    <div className="w-11 h-11 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded-[10px]">
                      <Bot className="size-5 text-orange-400" />
                    </div>
                    <span className="py-1.5 px-3 text-xs sm:text-sm font-medium leading-normal tracking-[-0.1px] rounded-[10px] inline-block bg-white/5 border border-white/10 text-neutral-300 font-mono">
                      03. MCP Protocol
                    </span>
                  </div>
                  <h3 className="text-xl text-offWhite font-medium leading-normal mt-7.5">
                    Autonomous Sprint &amp; Task Triage via MCP
                  </h3>
                  <div className="my-4 gradient-border w-full h-[1px]"></div>
                  <p className="text-offWhite/60 text-sm sm:text-base leading-relaxed">
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
