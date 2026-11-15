"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { CornerTicks } from "@/components/landing/corner-ticks";

/**
 * Cloudflare's "Fighting infra with cloud vs Shipping with Cloudflare"
 * split, Scylla-flavored: white pain half with a halftone waveform, solid
 * orange solved half with tick rows. Waveform columns scale in on reveal.
 */

// Deterministic pseudo-random waveform heights (no Math.random at render).
const WAVE_SEED = [7, 13, 29, 5, 17, 31, 3, 23, 11, 37, 2, 19, 41, 9, 27, 15];
function waveHeight(i: number): number {
  const a = WAVE_SEED[i % WAVE_SEED.length];
  const b = WAVE_SEED[(i * 7 + 3) % WAVE_SEED.length];
  const envelope = Math.sin((i / 46) * Math.PI);
  return 0.12 + (((a * b) % 100) / 100) * 0.88 * envelope;
}

const WAVE_COLS = 46;

const SOLVED = [
  {
    title: "Every calendar in one view",
    body: "Overlays across the whole team — no tab-hopping between tools.",
  },
  {
    title: "Rooms booked automatically",
    body: "Capacity, location, and conflicts checked before you ask.",
  },
  {
    title: "Tasks meet their meetings",
    body: "Backlog items snap onto the timeline as deep-work blocks.",
  },
  {
    title: "Agents do the busywork",
    body: "MCP assistants resolve nicknames, compare schedules, and book.",
  },
];

export function LandingComparison() {
  return (
    <section className="relative" data-comparison="">
      <div className="container">
        <div className="border-container py-8 sm:py-10">
          <div
            className="hairline-grid grid grid-cols-1 lg:grid-cols-2 gap-px relative"
            data-sttr-wrapper=""
          >
            <CornerTicks />

            {/* Pain half — halftone waveform */}
            <div data-sttr-card="" className="relative">
              <div className="h-full px-7 py-12 md:py-16 flex flex-col justify-between gap-10">
                <h3 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold !leading-[1.15] -tracking-[0.02em] text-[#18181b] dark:text-[#fbfbfb]">
                  Fighting five tools
                  <br />
                  for one meeting
                </h3>
                <div
                  className="wave-field flex items-end gap-[3px] h-[150px] sm:h-[190px]"
                  data-wave-field=""
                  aria-hidden="true"
                >
                  {Array.from({ length: WAVE_COLS }, (_, i) => {
                    const h = waveHeight(i);
                    return (
                      <span
                        key={i}
                        data-wave-col=""
                        className="wave-col flex-1 flex flex-col justify-end items-center gap-[3px]"
                        style={{
                          height: `${Math.round(h * 100)}%`,
                        }}
                      >
                        {Array.from({ length: 7 }, (_, row) => (
                          <span
                            key={row}
                            className="wave-dot block w-[3px] h-[3px] rounded-full bg-[#18181b]/25 dark:bg-white/20"
                            style={{
                              opacity: row / 6 < h ? 1 : 0.12,
                            }}
                          />
                        ))}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Solved half — solid orange */}
            <div
              data-sttr-card=""
              className="solid-orange relative flex flex-col justify-center px-7 py-12 md:py-16 gap-7"
            >
              <h3 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold !leading-[1.15] -tracking-[0.02em] text-white">
                Shipping with Scylla
              </h3>
              <ul className="flex flex-col divide-y divide-white/20">
                {SOLVED.map((item) => (
                  <li
                    key={item.title}
                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <Check
                        className="size-3.5 text-white"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="text-sm text-white/75 mt-0.5">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
