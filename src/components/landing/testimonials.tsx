"use client";

import * as React from "react";

interface TestimonialItem {
  avatar: string;
  name: string;
  role: string;
  comment: string;
}

const COLUMN_1_ITEMS: TestimonialItem[] = [
  {
    avatar: "/images/testimonial-01.jpg",
    name: "Marcus Vance",
    role: "VP of Engineering",
    comment:
      "Scylla eliminated our weekly scheduling chaos. Our developers now get uninterrupted 4-hour deep work blocks without random meeting interruptions.",
  },
  {
    avatar: "/images/testimonial-02.jpg",
    name: "Sarah Jenkins",
    role: "Head of Product",
    comment:
      "Having our calendar sync directly with sprint backlog tasks is a game changer. Every meeting now has linked deliverables and clear owners.",
  },
  {
    avatar: "/images/testimonial-03.jpg",
    name: "Alex Rivera",
    role: "Lead Architect",
    comment:
      "The real-time Google Calendar two-way sync is bulletproof. Zero lag, zero ghost bookings, and instant team availability overlays.",
  },
];

const COLUMN_2_ITEMS: TestimonialItem[] = [
  {
    avatar: "/images/testimonial-04.jpg",
    name: "Elena Rostova",
    role: "Founder & CEO",
    comment:
      "We replaced three separate tools—Linear, Calendly, and Toggl—with Scylla. It cut our software overhead in half while doubling cross-team visibility.",
  },
  {
    avatar: "/images/testimonial-05.jpg",
    name: "Daniel Kim",
    role: "CTO",
    comment:
      "Connecting Claude Desktop and Cursor to Scylla via MCP gives us superpowers. Our AI agent now triages backlogs and books syncs autonomously.",
  },
  {
    avatar: "/images/testimonial-06.jpg",
    name: "Maya Patel",
    role: "Engineering Manager",
    comment:
      "Comparing 8 engineers' schedules used to take 20 minutes of Slack back-and-forth. With Scylla's overlay, I spot mutual free slots in 5 seconds.",
  },
];

const COLUMN_3_ITEMS: TestimonialItem[] = [
  {
    avatar: "/images/testimonial-07.jpg",
    name: "Liam Chen",
    role: "Staff Software Engineer",
    comment:
      "The sub-second live session timers give me honest data on where my sprint time goes. It completely changed how I estimate complex technical stories.",
  },
  {
    avatar: "/images/testimonial-08.jpg",
    name: "Rachel Adams",
    role: "Technical Program Manager",
    comment:
      "Project-linked meeting agendas keep our sprint reviews laser-focused. Action items convert directly into Kanban tasks with one click.",
  },
  {
    avatar: "/images/testimonial-09.jpg",
    name: "Kevin Zhang",
    role: "DevOps Tech Lead",
    comment:
      "Room availability and Google Meet link generation work flawlessly. It's by far the most dependable scheduling platform we've ever deployed.",
  },
];

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <div>
      <div className="px-5 pt-5 pb-6 md:pb-8 bg-blue rounded-xl sm:rounded-2xl lg:rounded-[20px] border border-lineColor/70 relative transition-all duration-300 hover:border-white/30">
        <div className="flex items-center gap-4">
          <img
            className="w-10.5 h-10.5 object-cover rounded-full border border-white/10"
            src={item.avatar}
            alt={item.name}
          />
          <div className="flex-1">
            <h3 className="font-dmSans text-offWhite text-base leading-tight font-medium">
              {item.name}
            </h3>
            <p className="text-offWhite/60 text-xs sm:text-sm leading-tight mt-1">
              {item.role}
            </p>
          </div>
        </div>
        <div className="my-4 md:my-5 gradient-border w-full h-px"></div>
        <p className="text-offWhite/80 text-sm leading-relaxed">
          {item.comment}
        </p>
      </div>
    </div>
  );
}

export function LandingTestimonials() {
  // Duplicate for continuous seamless infinite CSS scrolling
  const col1 = [...COLUMN_1_ITEMS, ...COLUMN_1_ITEMS];
  const col2 = [...COLUMN_2_ITEMS, ...COLUMN_2_ITEMS];
  const col3 = [...COLUMN_3_ITEMS, ...COLUMN_3_ITEMS];

  return (
    <section className="section-bottom-border">
      <div className="container">
        <div className="border-container section-spacing-lg">
          {/* Section Title */}
          <div
            className="max-w-[450px] sm:max-w-[540px] lg:max-w-[650px] mx-auto text-center mb-10 sm:mb-12 md:mb-16 xl:mb-20"
            data-section-title=""
          >
            <span className="badge-button mb-5" data-subtitle="">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5" />
              Proven Impact
            </span>
            <h2
              className="gradient-text text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] !leading-[1.2] font-semibold -tracking-[0.4px] overflow-hidden"
              data-title=""
            >
              Trusted by Engineers, Loved by High-Velocity Teams
            </h2>
            <p
              className="mt-4 md:mt-5 text-offWhite/80 text-sm sm:text-base lg:text-lg overflow-hidden leading-relaxed"
              data-excerpt=""
            >
              See how engineering leaders, founders, and product teams eliminate
              calendar chaos and protect deep work with Scylla.
            </p>
          </div>

          <div className="relative" data-lag="0.3">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 overflow-hidden relative h-[500px] sm:h-[700px] testimonial-wrapper">
              {/* Column 1: Forward scroll */}
              <div className="flex flex-col gap-5 auto-scroll-content">
                {col1.map((item, idx) => (
                  <TestimonialCard key={`c1-${idx}`} item={item} />
                ))}
              </div>

              {/* Column 2: Reverse scroll */}
              <div className="hidden sm:flex flex-col gap-5 auto-scroll-content-reverse">
                {col2.map((item, idx) => (
                  <TestimonialCard key={`c2-${idx}`} item={item} />
                ))}
              </div>

              {/* Column 3: Forward scroll */}
              <div className="hidden md:flex flex-col gap-5 auto-scroll-content">
                {col3.map((item, idx) => (
                  <TestimonialCard key={`c3-${idx}`} item={item} />
                ))}
              </div>
            </div>
            <div className="testimonial-overlay h-[calc(100%+10px)] !top-[-5px] pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
