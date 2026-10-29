"use client";

import * as React from "react";
import Link from "next/link";

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
              <div className="w-full sm:w-[80%] lg:w-full max-w-[400px] md:max-w-[580px]">
                <h3
                  data-news-title=""
                  className="gradient-text !leading-[1.2] text-4xl md:text-5xl lg:text-[51px] font-semibold"
                >
                  Ready to Supercharge Your Tasks and Calendar?
                </h3>
                <p
                  data-news-excerpt=""
                  className="mt-4 sm:mt-5 text-offWhite/80"
                >
                  Join modern teams mastering daily execution and seamless team
                  scheduling with Scylla. Free forever to get started.
                </p>
                <div
                  data-news-button=""
                  className="mt-5 sm:mt-8 lg:mt-12 flex flex-wrap gap-4"
                >
                  <Link
                    className="button-primary inline-flex items-center justify-center px-[26px] py-3 text-white font-medium text-sm leading-normal rounded-[10px] relative z-1 overflow-hidden text-center shadow-lg shadow-primary/20 cursor-pointer"
                    href="/sign-in"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.replace("/sign-in");
                    }}
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    className="button-secondary text-sm cursor-pointer"
                    href="/calendar"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.replace("/calendar");
                    }}
                  >
                    View Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export { LandingCtaBanner as CtaBanner };
