"use client";

import * as React from "react";
import { HardLink } from "./hard-link";

export function LandingIntegrations() {
  return (
    <section className="section-bottom-border bg-[#09090b]">
      <div className="container">
        <div className="border-container section-spacing-lg">
          <div>
            <div
              className="bg-blue rounded-xl sm:rounded-2xl md:rounded-[20px] border border-lineColor/70 px-4 sm:px-6 md:px-9 pt-8 sm:pt-12 pb-10 sm:pb-20 md:pb-24 lg:pb-[150px] relative z-1 overflow-hidden flex items-center sm:items-start justify-between gap-10 flex-col sm:flex-row"
              data-container="apps-section"
            >
              {/* Content */}
              <div className="w-full max-w-[400px] sm:max-w-[590px] text-center sm:text-left">
                <span className="badge-button mb-3 inline-block">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5" />
                  Model Context Protocol
                </span>
                <h3
                  data-title=""
                  className="gradient-text !leading-[1.2] text-3xl md:text-4xl lg:text-5xl xl:text-[51px] font-semibold"
                >
                  Connect Scylla to Any AI Agent &amp; Workflow Stack
                </h3>
                <p
                  data-excerpt=""
                  className="mt-4 sm:mt-5 text-offWhite/80 text-sm sm:text-base leading-relaxed"
                >
                  Seamlessly bridge Scylla via standard Model Context Protocol
                  (MCP) to leading AI agents—including Claude Desktop, Cursor,
                  Windsurf, ChatGPT, Gemini, Copilot, and Cline. Empower your AI
                  assistants to query colleague calendars, book meeting rooms,
                  track active time, and organize project backlogs directly from
                  your coding workspace.
                </p>
                <div data-button="" className="mt-5 sm:mt-8 lg:mt-9">
                  <HardLink
                    className="button-primary inline-flex items-center justify-center px-[22px] py-3 text-white font-medium text-sm leading-normal rounded-[10px] relative z-1 overflow-hidden text-center cursor-pointer"
                    href="/tasks"
                  >
                    Explore MCP Tools
                  </HardLink>
                </div>
              </div>

              {/* Right: Original layout with updated AI agent blocks */}
              <div className="max-w-[351px] m-5 w-full" data-thumbnail="">
                <img
                  className="w-full"
                  src="/images/workflow-icons.png"
                  alt="AI Agent Workflow Stack"
                  data-lag="0.2"
                />
              </div>

              {/* Shapes */}
              <img
                data-bg-shape=""
                src="/images/workflow-shape.png"
                alt="workflow-shape"
                className="absolute bottom-0 left-0 -z-1"
              />
              <img
                data-glow-shape=""
                src="/images/newsletter-top-glow-shape.png"
                alt="newsletter-shape"
                className="absolute top-0 right-0 -z-1"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
