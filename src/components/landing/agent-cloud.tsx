"use client";

import * as React from "react";
import {
  siClaude,
  siClaudecode,
  siCline,
  siCursor,
  siGithubcopilot,
  siGooglegemini,
  siWindsurf,
  type SimpleIcon,
} from "simple-icons";
import { CornerTicks } from "@/components/landing/corner-ticks";

interface Agent {
  name: string;
  icon?: SimpleIcon;
  monogram?: string;
}

const AGENTS: Agent[] = [
  { name: "Claude Desktop", icon: siClaude },
  { name: "Claude Code", icon: siClaudecode },
  { name: "Codex", monogram: "Cx" },
  { name: "ChatGPT", monogram: "GPT" },
  { name: "Gemini", icon: siGooglegemini },
  { name: "Copilot", icon: siGithubcopilot },
  { name: "Cursor", icon: siCursor },
  { name: "Windsurf", icon: siWindsurf },
  { name: "Cline", icon: siCline },
  { name: "ZCode", monogram: "Z" },
  { name: "Antigravity", monogram: "Ag" },
];

function AgentMark({ agent }: { agent: Agent }) {
  if (agent.icon) {
    // currentColor keeps every logo visible on light and dark — brand hexes
    // like Cursor/Copilot (#000) vanish on dark backgrounds.
    return (
      <svg
        className="size-4 shrink-0"
        viewBox="0 0 24 24"
        role="img"
        aria-hidden="true"
      >
        <path d={agent.icon.path} fill="currentColor" />
      </svg>
    );
  }
  return (
    <span
      className="mono-chip flex size-5 shrink-0 items-center justify-center rounded-[5px] border border-[var(--sl-line)] text-[9px] leading-none"
      aria-hidden="true"
    >
      {agent.monogram}
    </span>
  );
}

function Chips({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex items-center gap-4 pr-4" aria-hidden={hidden}>
      {AGENTS.map((agent) => (
        <span key={agent.name} className="agent-chip text-sm">
          <AgentMark agent={agent} />
          {agent.name}
        </span>
      ))}
    </div>
  );
}

/**
 * Logo-cloud block in the spirit of Cloudflare's "trusted by" band —
 * the AI agents Scylla works with through MCP. Infinite marquee that
 * pauses on hover; static under prefers-reduced-motion.
 */
export function LandingAgentCloud() {
  return (
    <section className="relative" data-agent-cloud="">
      <div className="container">
        <div className="border-container pt-14 sm:pt-18 lg:pt-20 pb-16 sm:pb-20 lg:pb-24">
          <div
            className="max-w-[620px] mx-auto text-center mb-8 sm:mb-10"
            data-section-title=""
          >
            <h2
              className="text-xl sm:text-2xl font-medium text-[#18181b] dark:text-[#fbfbfb]"
              data-title=""
            >
              Works with the agents your team already uses
            </h2>
            <p
              className="mt-2 text-[#52525b] dark:text-[#a1a1aa] text-sm"
              data-excerpt=""
            >
              One MCP server — every coding assistant books rooms, files
              tickets, and reads calendars.
            </p>
          </div>
          <div
            className="rounded-[16px] border border-[#e4e4e7] bg-[var(--sl-surface)] px-6 py-7 relative dark:border-[#222227]"
            data-sttr-wrapper=""
          >
            <CornerTicks />
            <div className="marquee relative" data-marquee="">
              <div className="marquee-track">
                <Chips />
                <Chips hidden />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
