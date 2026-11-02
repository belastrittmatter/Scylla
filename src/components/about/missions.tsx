"use client";

import * as React from "react";
import { Sparkles, CalendarRange, Workflow, ShieldCheck } from "lucide-react";

export function Missions() {
  return (
    <section className="section-bottom-border pt-10 bg-[#09090b] relative z-1 overflow-hidden">
      <div className="container">
        <div className="border-container section-spacing-lg">
          <div
            className="flex items-center justify-between gap-10 lg:gap-16 flex-col lg:flex-row"
            data-sttr-wrapper=""
          >
            {/* Visual Media Showcase */}
            <div
              className="lg:max-w-[540px] xl:max-w-[580px] w-full"
              data-sttr-card=""
            >
              <div className="relative rounded-2xl md:rounded-[24px] overflow-hidden border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-1.5 sm:p-2.5 shadow-2xl">
                <div className="relative rounded-xl md:rounded-2xl overflow-hidden aspect-[4/3] bg-black/40">
                  <img
                    className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                    alt="Scylla engineering team collaborating in deep work"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Floating Stat Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-4 rounded-xl bg-[#121215]/90 backdrop-blur-md border border-white/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                        <CalendarRange className="size-5" />
                      </div>
                      <div>
                        <div className="text-offWhite font-semibold text-sm">
                          5+ Hours Saved Weekly
                        </div>
                        <div className="text-offWhite/60 text-xs">
                          Per engineer on scheduling overhead
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-orange-400 font-medium">
                      <Sparkles className="size-3.5" />
                      <span>Zero Conflicts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Content */}
            <div className="lg:max-w-[540px] xl:max-w-[580px] w-full" data-sttr-card="">
              <span className="badge-button mb-4 inline-block" data-subtitle="">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5 animate-pulse" />
                Our Mission &amp; Purpose
              </span>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] !leading-[1.15] font-semibold gradient-text tracking-[-0.02em]"
                data-title=""
              >
                Eliminating Calendar Friction to Protect Deep Work
              </h1>
              <p
                className="mt-4 sm:mt-5 text-offWhite/80 text-sm sm:text-base lg:text-lg leading-relaxed"
                data-excerpt=""
              >
                At Scylla, our mission is to free modern engineering and product
                teams from fragmented productivity apps and constant schedule
                coordination. We believe focus is the single most valuable asset in
                technology.
              </p>

              {/* Core Values / Pillars */}
              <div className="mt-8 space-y-4">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-3.5 transition-colors hover:border-white/15">
                  <div className="size-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                    <Workflow className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-offWhite font-medium text-base">
                      Unified Execution &amp; Scheduling
                    </h2>
                    <p className="text-offWhite/60 text-sm mt-1 leading-relaxed">
                      Tasks, deep-work timers, and calendar blocks exist in one
                      shared timeline. No disconnected tickets or forgotten action
                      items.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-3.5 transition-colors hover:border-white/15">
                  <div className="size-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-offWhite font-medium text-base">
                      Autonomous Intelligence via MCP
                    </h2>
                    <p className="text-offWhite/60 text-sm mt-1 leading-relaxed">
                      Embracing standard Model Context Protocol so AI coding
                      assistants like Claude and Cursor can handle sprint triage and
                      availability checks on your behalf.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Missions;