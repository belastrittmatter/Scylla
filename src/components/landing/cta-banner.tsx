"use client";

import * as React from "react";
import { HardLink } from "./hard-link";

export function LandingCtaBanner() {
  return (
    <section className="section-bottom-border bg-[#09090b]">
      <div className="container">
        <div className="border-container section-spacing-lg">
          <div data-lag="0.15">
            <div
              className="bg-blue sm:bg-transparent rounded-20 border border-lineColor/70 px-4 sm:px-6 md:px-9 py-10 sm:py-14 md:py-20 lg:py-[90px] relative z-1 overflow-hidden"
              data-newsletter-wrapper=""
            >
              <video
                className="hidden sm:block absolute top-0 right-0 w-full h-full object-cover bg-top-right -z-1"
                src="/media/newsletter.webm"
                autoPlay
                loop
                muted
                playsInline
                data-news-video=""
              />
              <img
                src="/images/newsletter-shape.png"
                alt="newsletter-shape"
                className="block sm:hidden absolute top-0 right-0 z-[-1] w-[30%] lg:w-auto"
              />
              <img
                src="/images/newsletter-top-glow-shape.png"
                alt="newsletter-shape"
                className="block sm:hidden absolute top-0 right-0 z-[-1]"
              />
              <img
                src="/images/newsletter-bottom-glow-shape.png"
                alt="newsletter-shape"
                className="block sm:hidden absolute bottom-0 left-0 z-[-1]"
              />

              {/* Content */}
              <div className="w-full sm:w-[85%] lg:w-full max-w-[420px] md:max-w-[620px]">
                <span className="badge-button mb-4 inline-block">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5 animate-pulse" />
                  Elevate Your Workflow
                </span>
                <h3
                  data-news-title=""
                  className="gradient-text !leading-[1.15] text-3xl sm:text-4xl md:text-5xl lg:text-[51px] font-semibold"
                >
                  Ready to Reclaim Your Team&apos;s Focus &amp; Rhythm?
                </h3>
                <p
                  data-news-excerpt=""
                  className="mt-4 sm:mt-5 text-offWhite/80 text-sm sm:text-base leading-relaxed"
                >
                  Join thousands of developers, designers, and high-velocity
                  teams orchestrating sprint backlogs and multi-person calendars
                  in one unified system.
                </p>
                <div
                  data-news-button=""
                  className="mt-6 sm:mt-8 lg:mt-10 flex flex-wrap items-center gap-4"
                >
                  <HardLink
                    className="button-primary inline-flex items-center justify-center px-7 py-3.5 text-white font-medium text-sm leading-normal rounded-[10px] relative z-1 overflow-hidden text-center shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all cursor-pointer"
                    href="/auth/sign-in"
                  >
                    Get Started Free
                  </HardLink>
                  <HardLink
                    className="button-secondary text-sm cursor-pointer !py-3.5 px-6"
                    href="/calendar"
                  >
                    Explore Live Calendar
                  </HardLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
