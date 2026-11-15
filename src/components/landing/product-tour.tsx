"use client";

import * as React from "react";

const STEPS = [
  {
    index: "01",
    title: "Find the slot",
    body: "The engine scans every attendee's working hours at 15-minute granularity — in their own timezone — and pads busy time with buffers.",
    image: "/images/calendar/why-chose-01.jpg",
    alt: "Team availability overlay across calendars",
  },
  {
    index: "02",
    title: "Book the room",
    body: "One command checks capacity, reserves the room, creates the Meet link, and sends invites — with rollback if anything fails.",
    image: "/images/calendar/why-chose-05.jpg",
    alt: "One-click booking link with room reservation",
  },
  {
    index: "03",
    title: "Track the work",
    body: "Linked tasks snap onto the timeline as deep-work blocks while sub-second session timers measure real focus.",
    image: "/images/calendar/why-chose-03.jpg",
    alt: "Deep-work session timers on the task board",
  },
];

/**
 * Cloudflare/Stripe-style scroll-scrubbed product tour. Desktop: the panel
 * pins and steps scrub with scroll. Mobile and reduced-motion: the steps
 * stack statically (progressive enhancement — no JS, no problem).
 */
export function LandingProductTour() {
  return (
    <section className="relative" data-tour="">
      <div className="container">
        <div className="border-container py-8 sm:py-10">
          {/* Full-viewport stage: GSAP pins this wrapper; flex keeps the
              panel vertically centered no matter how its height changes. */}
          <div
            className="relative lg:h-screen lg:flex lg:items-center lg:justify-center lg:overflow-hidden"
            data-tour-stage=""
          >
            <div
              className="tour-panel relative overflow-hidden rounded-[20px] border border-[#e4e4e7] bg-[var(--sl-surface)] dark:border-[#222227] w-full lg:max-w-[1420px]"
              data-tour-panel=""
            >
              {/* Progress rail */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-transparent z-10">
                <div
                  className="tour-progress h-full w-0 bg-[#ea580c] transition-none"
                  data-tour-progress=""
                />
              </div>

              <div className="grid lg:grid-cols-2 min-h-[520px]">
                {/* Steps */}
                <div className="flex flex-col justify-center px-7 sm:px-10 py-12 lg:py-16 gap-8">
                  {STEPS.map((step, i) => (
                    <div
                      key={step.index}
                      className={`tour-step flex gap-5 items-start transition-opacity duration-300 ${
                        i > 0 ? "hidden lg:flex" : ""
                      }`}
                      data-tour-step={i + 1}
                    >
                      <span className="mono-chip text-sm text-[#ea580c] pt-1">
                        {step.index}
                      </span>
                      <div>
                        <h3 className="text-2xl font-semibold text-[#18181b] dark:text-[#fbfbfb] !leading-tight">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-[#52525b] dark:text-[#a1a1aa] text-sm leading-relaxed max-w-[420px]">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="hidden lg:block h-px w-full bg-[var(--sl-line)]" />
                  <p className="hidden lg:block text-xs text-[#71717a] dark:text-[#a1a1aa]">
                    keep scrolling — the tour follows you
                  </p>
                </div>

                {/* Visual stack */}
                <div className="relative min-h-[300px] lg:min-h-[520px] bg-[var(--sl-frame)] dark:bg-[#0c0c0f] overflow-hidden">
                  {STEPS.map((step, i) => (
                    <img
                      key={step.index}
                      src={step.image}
                      alt={step.alt}
                      loading="lazy"
                      data-tour-image={i + 1}
                      className={`absolute inset-0 h-full w-full object-contain p-6 ${
                        i === 0 ? "" : "opacity-0"
                      }`}
                    />
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
