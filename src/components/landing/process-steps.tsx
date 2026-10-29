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
            <div className="max-w-[520px] md:max-w-[560px] w-full md:sticky sticky-card">
              <span className="badge-button mb-3 inline-block">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5" />
                Task Tracking Ecosystem
              </span>
              <h2
                data-title=""
                className="gradient-text text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] font-semibold -tracking-[0.4px] !leading-[1.1]"
              >
                Interactive Task Collaboration &amp; Live Time Tracking
              </h2>
              <p data-excerpt="" className="mt-4 md:mt-5 text-offWhite/80">
                Go beyond basic checklists. Discuss roadblocks with threaded
                comments, log every minute of deep work with precision timers,
                and leverage MCP tools to automate project management
                effortlessly.
              </p>
              <div className="mt-8">
                <Link
                  href="/tasks"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.replace("/tasks");
                  }}
                  className="inline-flex items-center justify-center px-6 py-3 text-white bg-white/10 hover:bg-white/15 border border-white/20 font-medium text-sm rounded-[10px] transition-colors shadow-lg shadow-orange-500/10 cursor-pointer"
                >
                  Explore Task Workflow
                </Link>
              </div>
            </div>
            <div
              className="md:max-w-[560px] w-full flex flex-col gap-5"
              data-card=""
            >
              {/* Process Card 1: Comment & Interactive Collaboration */}
              <div className="md:sticky sticky-card">
                <div className="px-5 pt-5 pb-5 md:pb-10 bg-blue rounded-[20px] border border-lineColor/70 transition-all duration-300 hover:border-white/30">
                  <div className="flex items-center justify-between gap-5">
                    <div className="w-11 h-11 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded-[10px]">
                      <MessageSquareText className="size-5 text-orange-400" />
                    </div>
                    <span className="py-1.5 px-3 text-sm font-medium leading-normal tracking-[-0.1px] rounded-[10px] inline-block bg-white/5 border border-white/10 text-neutral-300">
                      01. Collaboration
                    </span>
                  </div>
                  <h3 className="text-xl text-offWhite font-medium leading-normal mt-7.5">
                    Interactive Comments &amp; Team Discussions
                  </h3>
                  <div className="my-4 gradient-border w-full h-[1px]"></div>
                  <p className="text-offWhite/60">
                    Collaborate directly inside every task card. Leave threaded
                    comments, share actionable feedback, attach project context,
                    and mention teammates to resolve bottlenecks without context
                    switching.
                  </p>
                </div>
              </div>

              {/* Process Card 2: Live Time-Tracking */}
              <div className="md:sticky sticky-card">
                <div className="px-5 pt-5 pb-5 md:pb-10 bg-blue rounded-[20px] border border-lineColor/70 transition-all duration-300 hover:border-white/30">
                  <div className="flex items-center justify-between gap-5">
                    <div className="w-11 h-11 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded-[10px]">
                      <Timer className="size-5 text-orange-400" />
                    </div>
                    <span className="py-1.5 px-3 text-sm font-medium leading-normal tracking-[-0.1px] rounded-[10px] inline-block bg-white/5 border border-white/10 text-neutral-300">
                      02. Time-Tracking
                    </span>
                  </div>
                  <h3 className="text-xl text-offWhite font-medium leading-normal mt-7.5">
                    Live Session Timers &amp; Duration Tracking
                  </h3>
                  <div className="my-4 gradient-border w-full h-[1px]"></div>
                  <p className="text-offWhite/60">
                    Track real-time deep work sessions with active seconds
                    precision. Monitor task duration against initial estimates,
                    prevent burnout, and gain actionable velocity analytics for
                    every sprint.
                  </p>
                </div>
              </div>

              {/* Process Card 3: AI & MCP Management */}
              <div className="md:sticky sticky-card">
                <div className="px-5 pt-5 pb-5 md:pb-10 bg-blue rounded-[20px] border border-lineColor/70 transition-all duration-300 hover:border-white/30">
                  <div className="flex items-center justify-between gap-5">
                    <div className="w-11 h-11 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded-[10px]">
                      <Bot className="size-5 text-orange-400" />
                    </div>
                    <span className="py-1.5 px-3 text-sm font-medium leading-normal tracking-[-0.1px] rounded-[10px] inline-block bg-white/5 border border-white/10 text-neutral-300">
                      03. MCP Protocol
                    </span>
                  </div>
                  <h3 className="text-xl text-offWhite font-medium leading-normal mt-7.5">
                    AI Task Creation &amp; Project Management via MCP
                  </h3>
                  <div className="my-4 gradient-border w-full h-[1px]"></div>
                  <p className="text-offWhite/60">
                    Empower your favorite AI coding agents to create tasks,
                    organize team backlogs, update progress columns, and triage
                    projects autonomously using Scylla&apos;s standard Model
                    Context Protocol tools.
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
export { LandingProcessSteps as ProcessSteps };
