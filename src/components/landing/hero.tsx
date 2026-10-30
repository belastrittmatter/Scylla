"use client";

import * as React from "react";
import Link from "next/link";

export function LandingHero() {
  return (
    <>
      <div className="header-innerHeight">
        <div className="container">
          <div className="border-container"></div>
        </div>
      </div>
      {/* Banner Area Start */}
      <section
        className="section-bottom-border relative z-1 overflow-hidden"
        data-hero-section=""
      >
        {/* Recreated Coded Monochrome Spotlight Gradient (Black & White Glow) */}
        <div
          data-bg-shape=""
          data-lag="0.2"
          data-speed="0.6"
          className="absolute inset-0 pointer-events-none -z-1 overflow-hidden"
        >
          {/* Central Elliptical Ambient Spotlight - Replicating user's glow in luxury silver/white */}
          <div
            className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[160%] max-w-[1500px] h-[750px]"
            style={{
              background: `
                radial-gradient(ellipse 65% 50% at 50% 42%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.07) 32%, rgba(255, 255, 255, 0.02) 58%, transparent 75%),
                radial-gradient(ellipse 85% 65% at 50% 38%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 50%, transparent 80%)
              `,
            }}
          />

          {/* Elegant subtle concentric orbital guide rings */}
          <svg
            className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[1300px] h-[650px] opacity-20 pointer-events-none"
            viewBox="0 0 1300 650"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse
              cx="650"
              cy="270"
              rx="260"
              ry="160"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
            />
            <ellipse
              cx="650"
              cy="270"
              rx="420"
              ry="250"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray="5 7"
            />
            <ellipse
              cx="650"
              cy="270"
              rx="580"
              ry="340"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          </svg>
        </div>
        <div className="container">
          <div className="border-container pt-14 sm:pt-[72px] relative z-1">
            <div className="max-w-[500px] lg:max-w-[760px] mx-auto text-center">
              <span data-subtitle="" className="badge-button">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
                AI-Powered Productivity
              </span>
              <h1
                data-title=""
                className="font-semibold !leading-[1.18] gradient-text text-4xl sm:text-5xl lg:text-9xl mt-5"
              >
                Master Tasks Schedule Seamlessly with{" "}
                <span className="italic font-normal">Scylla</span>
              </h1>
              <p
                data-excerpt=""
                className="mt-3 font-medium text-base !leading-[1.4] tracking-[0.2px] text-offWhite/80"
              >
                An all-in-one workspace unifying visual drag-and-drop task
                boards, live time-tracking, and full-featured multi-person
                calendar scheduling. Say goodbye to fragmented apps and missed
                deadlines.
              </p>
              <div
                data-button=""
                className="mt-6 sm:mt-8 lg:mt-10 flex flex-wrap items-center justify-center gap-4"
              >
                <Link
                  className="button-secondary cursor-pointer"
                  href="/calendar"
                >
                  Launch Calendar
                </Link>
                <Link
                  className="button-primary inline-flex items-center justify-center px-[26px] py-3 text-white font-medium text-sm leading-normal rounded-[10px] relative z-1 overflow-hidden text-center shadow-lg shadow-orange-500/20 cursor-pointer"
                  href="/tasks"
                >
                  Manage Tasks Free
                </Link>
              </div>
            </div>
            <div
              data-thumbnail=""
              className="home-banner-dashboard mt-10 lg:mt-11.5 rounded-t-[20px] overflow-hidden p-1 sm:p-2.5 !pb-0 border border-white/10 border-b-0 bg-gradient-to-b from-white/10 to-transparent glowing-border"
            >
              <img
                className="rounded-t-[20px] w-full"
                src="/images/banner-dashboard.png"
                alt="Scylla Task & Calendar dashboard preview"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Banner Area End */}
    </>
  );
}
export { LandingHero as Hero };
