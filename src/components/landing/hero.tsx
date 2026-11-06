"use client";

import * as React from "react";
import Link from "next/link";

export function LandingHero() {
  return (
    <>
      <div className="header-innerHeight">
        <div className="container">
          <div className="border-container pt-[60px] lg:pt-[71px]"></div>
        </div>
      </div>
      {/* Banner Area Start */}
      <section
        className="section-bottom-border relative z-1 overflow-hidden"
        data-hero-section=""
      >
        <img
          src="/images/banner-bg.webp"
          alt=""
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-none h-auto min-h-full object-cover opacity-60 mix-blend-screen"
          style={{
            filter: "grayscale(100%) contrast(1.2)",
          }}
        />
        <div className="container">
          <div className="border-container pt-12 sm:pt-16 lg:pt-20 relative z-1">
            <div className="max-w-[560px] md:max-w-[720px] lg:max-w-[840px] mx-auto text-center">
              <span data-subtitle="" className="badge-button">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
                AI-Powered Task &amp; Calendar Engine
              </span>
              <h1
                data-title=""
                className="font-semibold !leading-[1.12] gradient-text text-3xl sm:text-5xl lg:text-6xl xl:text-[64px] tracking-[-0.025em] mt-5"
              >
                Master Your Tasks. Harmonize Every Schedule with{" "}
                <span className="italic font-normal">Scylla</span>
              </h1>
              <p
                data-excerpt=""
                className="mt-4 md:mt-5 font-normal text-sm sm:text-base lg:text-lg !leading-[1.65] tracking-[0.1px] text-offWhite/80 max-w-[700px] mx-auto"
              >
                The unified workspace bridging visual Kanban boards, sub-second
                deep-work timers, and intelligent multi-person calendar
                scheduling. Eliminate context switching and keep your team in
                sync.
              </p>
              <div
                data-button=""
                className="mt-6 sm:mt-8 lg:mt-10 flex flex-wrap items-center justify-center gap-4"
              >
                <Link
                  prefetch={false}
                  className="button-primary inline-flex items-center justify-center px-7 py-3.5 text-white font-medium text-sm leading-normal rounded-[10px] relative z-1 overflow-hidden text-center shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all cursor-pointer"
                  href="/auth/sign-in"
                >
                  Get Started Free
                </Link>
                <Link
                  prefetch={false}
                  className="button-secondary cursor-pointer !py-3.5 px-6 text-sm"
                  href="/calendar"
                >
                  Explore Live Calendar
                </Link>
              </div>
            </div>
            {/* Dashboard Thumbnail Wrapper with Backlight Bloom rising behind it */}
            <div data-thumbnail="" className="relative mt-10 lg:mt-11.5">
              <div className="home-banner-dashboard relative z-1 rounded-t-[20px] overflow-hidden p-1 sm:p-2.5 !pb-0 border border-white/10 border-b-0 bg-gradient-to-b from-white/10 to-transparent glowing-border">
                <img
                  className="rounded-t-[20px] w-full"
                  src="/images/calendar-dashboard-preview.png"
                  alt="Scylla Task & Calendar dashboard preview"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Banner Area End */}
    </>
  );
}
