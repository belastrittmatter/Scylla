"use client";

import * as React from "react";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "How do AI agents connect to Scylla?",
    a: "Through the standard Model Context Protocol. Point any MCP client — Claude Desktop, Cursor, Windsurf, Codex — at your Scylla MCP endpoint, sign in once over OAuth 2.1, and the agent can query availability, book rooms, and manage tasks with scoped permissions.",
  },
  {
    q: "Which calendars does Scylla sync with?",
    a: "Google Calendar syncs two-way in real time — meetings booked in Scylla appear in Google instantly, and external changes flow back. Microsoft Outlook import is supported for availability overlays.",
  },
  {
    q: "How are meeting rooms handled?",
    a: "Physical rooms sync from your workspace directory with capacity and location. Scylla checks conflicts, capacity, and office before proposing a slot, and the room is booked alongside the meeting automatically.",
  },
  {
    q: "Can agents see everyone's calendar?",
    a: "No. Scopes are fail-closed: an agent only sees what its consented capabilities allow, every action is attributed to a user identity, and revoking consent invalidates tokens immediately.",
  },
  {
    q: "Does it work across timezones?",
    a: "Yes. Working hours are evaluated per attendee in their own timezone, and mutual slots never span midnight for anyone on the invite.",
  },
];

/**
 * Bordered FAQ accordion — grid-rows trick animates height smoothly
 * without JS measurement, one panel open at a time.
 */
export function LandingFaq() {
  const [open, setOpen] = React.useState<number>(0);

  return (
    <section className="relative" data-faq="">
      <div className="container">
        <div className="border-container py-8 sm:py-10">
          <div
            className="max-w-[640px] mx-auto text-center mb-8 sm:mb-10"
            data-section-title=""
          >
            <h2
              className="text-3xl sm:text-4xl font-semibold -tracking-[0.02em] text-[#18181b] dark:text-[#fbfbfb]"
              data-title=""
            >
              Questions, answered
            </h2>
            <p
              className="mt-3 text-[#52525b] dark:text-[#a1a1aa] text-sm sm:text-base"
              data-excerpt=""
            >
              The short version — the docs cover the rest.
            </p>
          </div>
          <div
            className="rounded-[16px] border border-[#e4e4e7] bg-[var(--sl-surface)] dark:border-[#222227] divide-y divide-[#e4e4e7] dark:divide-[#222227] overflow-hidden"
            data-sttr-wrapper=""
          >
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={i} data-sttr-card="">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left cursor-pointer"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span className="font-medium text-[#18181b] dark:text-[#fbfbfb] text-sm sm:text-base">
                      {item.q}
                    </span>
                    <Plus
                      className={`size-4 shrink-0 text-[#ea580c] transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    aria-hidden={!isOpen}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen
                        ? "[grid-template-rows:1fr]"
                        : "[grid-template-rows:0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-[#52525b] dark:text-[#a1a1aa] max-w-[640px]">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
