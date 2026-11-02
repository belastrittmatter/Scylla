"use client";

import * as React from "react";
import {
  CalendarDays,
  Clock,
  Layers,
  Bot,
  Users,
  CheckCircle2,
} from "lucide-react";

const FEATURE_CHIPS = [
  { icon: Layers, label: "Visual Kanban Boards" },
  { icon: Clock, label: "Sub-Second Focus Timers" },
  { icon: CalendarDays, label: "2-Way Calendar Sync" },
  { icon: Users, label: "Multi-Person Availability" },
  { icon: Bot, label: "Native MCP AI Protocol" },
];

export function FeaturesHero() {
  return (
    <section className="section-bottom-border bg-[#09090b] relative z-1 overflow-hidden pt-12 sm:pt-16 lg:pt-20">
      <div className="container">
        <div className="border-container section-spacing-lg text-center">
          <div className="max-w-[760px] mx-auto" data-section-title="">
            <span className="badge-button mb-5 inline-block" data-subtitle="">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5 animate-pulse" />
              Scylla Platform Capabilities
            </span>
            <h1
              className="gradient-text text-3xl sm:text-4xl md:text-5xl lg:text-[56px] !leading-[1.15] font-semibold -tracking-[0.02em]"
              data-title=""
            >
              Engineered for Deep Work &amp; Seamless Coordination
            </h1>
            <p
              className="mt-4 sm:mt-5 text-offWhite/80 text-sm sm:text-base lg:text-lg leading-relaxed max-w-[660px] mx-auto"
              data-excerpt=""
            >
              Explore the complete feature stack behind Scylla. Everything from
              drag-and-drop sprint execution and active time analytics to
              multi-person schedule overlays and native AI coding agent
              automation.
            </p>
          </div>

          {/* Quick Feature Chips */}
          <div
            className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-[850px] mx-auto"
            data-sttr-wrapper=""
          >
            {FEATURE_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <div
                  key={chip.label}
                  className="px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all flex items-center gap-2 text-xs sm:text-sm text-offWhite/90 font-medium cursor-default shadow-sm"
                  data-sttr-card=""
                >
                  <Icon className="size-4 text-orange-400" />
                  <span>{chip.label}</span>
                </div>
              );
            })}
          </div>

          {/* Feature Highlights Grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-12 sm:mt-16 text-left"
            data-sttr-wrapper=""
          >
            <div
              className="p-6 rounded-2xl border border-white/10 bg-[#121215]/60 backdrop-blur-sm"
              data-sttr-card=""
            >
              <div className="size-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4">
                <Layers className="size-5" />
              </div>
              <h2 className="text-offWhite font-semibold text-lg">
                Frictionless Task Management
              </h2>
              <p className="text-offWhite/60 text-sm mt-2 leading-relaxed">
                Organize sprint backlogs with fluid drag-and-drop boards,
                threaded notes, and priority tags designed for high-velocity
                teams.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-orange-400/90 font-medium">
                <CheckCircle2 className="size-3.5" />
                <span>Zero Context Switching</span>
              </div>
            </div>

            <div
              className="p-6 rounded-2xl border border-white/10 bg-[#121215]/60 backdrop-blur-sm"
              data-sttr-card=""
            >
              <div className="size-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4">
                <CalendarDays className="size-5" />
              </div>
              <h2 className="text-offWhite font-semibold text-lg">
                Multi-Person Calendar Intelligence
              </h2>
              <p className="text-offWhite/60 text-sm mt-2 leading-relaxed">
                Layer teammates’ schedules, check room availability, and lock
                tasks directly into visual deep-work timeline blocks.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-orange-400/90 font-medium">
                <CheckCircle2 className="size-3.5" />
                <span>Two-Way Google &amp; Outlook Sync</span>
              </div>
            </div>

            <div
              className="p-6 rounded-2xl border border-white/10 bg-[#121215]/60 backdrop-blur-sm"
              data-sttr-card=""
            >
              <div className="size-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4">
                <Bot className="size-5" />
              </div>
              <h2 className="text-offWhite font-semibold text-lg">
                AI Coding Agent Automation
              </h2>
              <p className="text-offWhite/60 text-sm mt-2 leading-relaxed">
                Expose standard Model Context Protocol (MCP) server tools to
                Claude Desktop, Cursor, and Windsurf to triage tasks
                autonomously.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-orange-400/90 font-medium">
                <CheckCircle2 className="size-3.5" />
                <span>Standard MCP 1.0 Specification</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesHero;
