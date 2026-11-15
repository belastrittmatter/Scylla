"use client";

import * as React from "react";
import Link from "next/link";

export function LandingCtaBanner() {
  return (
    <section className="relative">
      <div className="container">
        <div className="border-container section-spacing-lg">
          <div
            className="cta-panel on-orange px-6 sm:px-10 md:px-14 py-12 sm:py-16 md:py-20 lg:py-[90px]"
            data-newsletter-wrapper=""
          >
            {/* Content */}
            <div className="relative z-1 w-full lg:w-[70%] max-w-[620px]">
              <span className="badge-button mb-4 inline-block !border-white/30 !bg-white/10 !text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5 !bg-white" />
                Elevate Your Workflow
              </span>
              <h3
                data-news-title=""
                className="!leading-[1.15] text-3xl sm:text-4xl md:text-5xl lg:text-[51px] font-semibold text-white"
              >
                Ready to Reclaim Your Team&apos;s Focus &amp; Rhythm?
              </h3>
              <p
                data-news-excerpt=""
                className="mt-4 sm:mt-5 text-white/85 text-sm sm:text-base leading-relaxed"
              >
                Join thousands of developers, designers, and high-velocity teams
                orchestrating sprint backlogs and multi-person calendars in one
                unified system.
              </p>
              <div
                data-news-button=""
                className="mt-6 sm:mt-8 lg:mt-10 flex flex-wrap items-center gap-4"
              >
                <Link
                  prefetch={false}
                  className="button-white inline-flex items-center justify-center px-7 py-3.5 font-medium text-sm leading-normal text-center cursor-pointer"
                  href="/auth/sign-in"
                >
                  Get Started Free
                </Link>
                <Link
                  prefetch={false}
                  className="button-secondary text-sm cursor-pointer !py-3.5 px-6"
                  href="/calendar"
                >
                  Explore Live Calendar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
