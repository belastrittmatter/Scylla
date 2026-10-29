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
    name: "Jenifer Lawrence",
    role: "CEO & Engineer",
    comment:
      "Scylla has completely transformed the way we manage projects. The automation features save us hours each week.",
  },
  {
    avatar: "/images/testimonial-02.jpg",
    name: "David Thompson",
    role: "Marketing Director",
    comment:
      "With real-time insights, we make faster, better decisions. Scylla is now a core part of our daily workflow.",
  },
  {
    avatar: "/images/testimonial-03.jpg",
    name: "Sophia Martinez",
    role: "Product Manager",
    comment:
      "Real-time analytics help us spot issues before they become problems. Scylla keeps us proactive.",
  },
];

const COLUMN_2_ITEMS: TestimonialItem[] = [
  {
    avatar: "/images/testimonial-04.jpg",
    name: "Emily Carter",
    role: "Creative Director",
    comment:
      "Integrations are seamless. Now all our design, feedback, and task tracking live in one place.",
  },
  {
    avatar: "/images/testimonial-05.jpg",
    name: "Daniel Kim",
    role: "CTO",
    comment:
      "The AI-powered recommendations have improved our workflow efficiency by over 40%.",
  },
  {
    avatar: "/images/testimonial-06.jpg",
    name: "Olivia Green",
    role: "Project Manager",
    comment:
      "Finally, a platform that grows with our needs. We've scaled without losing control of our processes.",
  },
];

const COLUMN_3_ITEMS: TestimonialItem[] = [
  {
    avatar: "/images/testimonial-07.jpg",
    name: "Chloe Davis",
    role: "HR Coordinator",
    comment:
      "Integrations are seamless. Now all our design, feedback, and task tracking live in one place.",
  },
  {
    avatar: "/images/testimonial-08.jpg",
    name: "Jack Wilson",
    role: "Senior Developer",
    comment:
      "The dashboards are so clear and customizable—it's easy to present insights to leadership.",
  },
  {
    avatar: "/images/testimonial-09.jpg",
    name: "Grace Nguyen",
    role: "Customer Success Manager",
    comment:
      "Lead tracking is now effortless. Our close rate has improved significantly since using Scylla.",
  },
];

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <div>
      <div className="px-5 pt-5 pb-6 md:pb-10 bg-blue rounded-xl sm:rounded-2xl lg:rounded-[20px] border border-lineColor/70 relative">
        <div className="flex items-center gap-4">
          <img
            className="w-10.5 h-10.5 object-cover rounded-full"
            src={item.avatar}
            alt={item.name}
          />
          <div className="flex-1">
            <h3 className="font-dmSans text-offWhite text-base leading-tight font-normal">
              {item.name}
            </h3>
            <p className="text-offWhite/60 text-sm leading-tight mt-1">
              {item.role}
            </p>
          </div>
        </div>
        <div className="my-4 md:my-5 lg:my-6 gradient-border w-full h-px"></div>
        <p className="text-offWhite">{item.comment}</p>
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
            className="max-w-[450px] sm:max-w-[520px] lg:max-w-[600px] mx-auto text-center mb-10 sm:mb-12 md:mb-16 xl:mb-20"
            data-section-title=""
          >
            <span className="badge-button mb-5" data-subtitle="">
              Testimonial
            </span>
            <h2
              className="gradient-text text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] !leading-[1.2] font-semibold -tracking-[0.4px] overflow-hidden"
              data-title=""
            >
              Trusted by professionals, loved by every teams.
            </h2>
            <p
              className="mt-4 md:mt-5 text-offWhite/80 overflow-hidden"
              data-excerpt=""
            >
              From startups to global enterprises, our users share how
              Scylla&apos;s AI tools help them work smarter, faster, and more
              efficiently.
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
export { LandingTestimonials as Testimonials };
