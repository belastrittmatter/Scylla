"use client";

import * as React from "react";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-[#09090b]">
      <div className="container">
        <div className="border-container pt-15 sm:pt-20 lg:pt-24 xl:pt-[100px] pb-4 sm:pb-5 md:pb-6 lg:pb-20 xl:pb-8 2xl:pb-10">
          <div
            className="px-4 py-8 sm:p-8 md:p-10 bg-blue rounded-[20px] border border-lineColor/70"
            data-sttr-wrapper=""
          >
            <div
              className="flex items-start justify-between gap-10 flex-col lg:flex-row"
              data-sttr-card=""
            >
              <div className="lg:max-w-[320px] w-full flex flex-col sm:flex-row lg:flex-col justify-between gap-5 sm:gap-7">
                <div className="max-w-[320px] lg:max-w-none w-full">
                  <div className="mb-4">
                    <img
                      src="/images/logo.svg"
                      alt="Scylla logo"
                      className="h-7 w-auto"
                    />
                  </div>
                  <h2 className="text-[25px]">Stay Updated</h2>
                  <p className="mt-3 sm:mt-4 text-offWhite/80 text-sm">
                    Subscribe to our newsletter for the latest product releases,
                    tips, and workflow insights.
                  </p>
                </div>
                <div className="max-w-[320px] lg:max-w-none w-full">
                  <form
                    action="#"
                    name="footer-form"
                    onSubmit={(e) => e.preventDefault()}
                    className="lg:max-w-[292px] relative"
                  >
                    <input
                      className="h-[54px] w-full p-3 pr-20 text-sm text-white placeholder:text-offWhite/60 font-medium leading-none bg-[#18181b] rounded-[10px] outline-none border border-white/10 focus:border-white/30 transition-colors"
                      type="email"
                      placeholder="name@example.com"
                      name="footer-email"
                    />
                    <button
                      type="submit"
                      className="button-secondary h-10 !absolute top-[7px] right-[6px] text-xs px-4"
                    >
                      Join
                    </button>
                  </form>
                  <div className="flex items-center gap-6 mt-5 sm:mt-7 text-offWhite/70">
                    <a
                      href="#"
                      aria-label="GitHub"
                      className="hover:text-primary transition-colors"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    </a>
                    <a
                      href="#"
                      aria-label="X"
                      className="hover:text-primary transition-colors"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M10.5222 7.77491L16.4785 1H15.0671L9.89516 6.88256L5.76437 1H1L7.24656 9.89547L1 17H2.41155L7.87321 10.7878L12.2356 17H17L10.5218 7.77491H10.5222ZM8.58887 9.97384L7.95596 9.08805L2.92015 2.03974H5.0882L9.15216 7.72795L9.78507 8.61374L15.0677 16.0075H12.8997L8.58887 9.97418V9.97384Z"
                          fill="currentColor"
                        />
                      </svg>
                    </a>
                    <a
                      href="#"
                      aria-label="Email"
                      className="hover:text-primary transition-colors"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M15.8299 2.80859H2.53295C2.05205 2.80859 1.59086 2.99963 1.25081 3.33968C0.910763 3.67972 0.719727 4.14092 0.719727 4.62182V4.98688L9.18146 9.96481L17.6432 4.98447V4.62182C17.6432 4.14092 17.4521 3.67972 17.1121 3.33968C16.772 2.99963 16.3109 2.80859 15.8299 2.80859Z"
                          fill="currentColor"
                        />
                        <path
                          d="M17.6432 6.39062L9.48851 11.1896C9.41141 11.2349 9.32523 11.2625 9.23613 11.2704C9.14711 11.2783 9.05741 11.2665 8.97356 11.2356L8.87441 11.1896L0.719727 6.39304V14.2951C0.719727 14.776 0.910763 15.2372 1.25081 15.5772C1.59086 15.9172 2.05205 16.1083 2.53295 16.1083H15.8299C16.3109 16.1083 16.772 15.9172 17.1121 15.5772C17.4521 15.2372 17.6432 14.776 17.6432 14.2951V6.39062Z"
                          fill="currentColor"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Navigation Columns */}
              <div className="lg:max-w-[560px] w-full flex items-start justify-between gap-4 sm:gap-10 flex-col sm:flex-row footer-menu-wrapper">
                <div className="w-full sm:w-auto pb-4 sm:pb-0 border-b sm:border-b-0 border-lineColor last:border-b-0 last:pb-0">
                  <button className="!text-lg text-white font-medium -tracking-tight flex items-center justify-between gap-5 w-full footer-menu-toggle">
                    Product
                    <img
                      className="block sm:hidden"
                      src="/images/footer-arrow.svg"
                      alt="icon"
                    />
                  </button>
                  <div className="footer-menu-list overflow-hidden">
                    <ul className="flex flex-col gap-2.5 pt-4.5">
                      <li>
                        <Link
                          className="text-offWhite/80 transition-colors duration-300 hover:text-primary cursor-pointer"
                          href="/tasks"
                        >
                          Task Kanban Board
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="text-offWhite/80 transition-colors duration-300 hover:text-primary cursor-pointer"
                          href="/calendar"
                        >
                          Smart Calendar
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="text-offWhite/80 transition-colors duration-300 hover:text-primary cursor-pointer"
                          href="/projects"
                        >
                          Projects
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="text-offWhite/80 transition-colors duration-300 hover:text-primary cursor-pointer"
                          href="/teams"
                        >
                          Teams
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="w-full sm:w-auto pb-4 sm:pb-0 border-b sm:border-b-0 border-lineColor last:border-b-0 last:pb-0">
                  <button className="!text-lg text-white font-medium -tracking-tight flex items-center justify-between gap-5 w-full footer-menu-toggle">
                    Resources
                    <img
                      className="block sm:hidden"
                      src="/images/footer-arrow.svg"
                      alt="icon"
                    />
                  </button>
                  <div className="footer-menu-list overflow-hidden">
                    <ul className="flex flex-col gap-2.5 pt-4.5">
                      <li>
                        <Link
                          className="text-offWhite/80 transition-colors duration-300 hover:text-primary"
                          href="#pricing"
                        >
                          Pricing Plans
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="text-offWhite/80 transition-colors duration-300 hover:text-primary cursor-pointer"
                          href="/calendar"
                        >
                          Integrations
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="text-offWhite/80 transition-colors duration-300 hover:text-primary cursor-pointer"
                          href="/support"
                        >
                          Support Center
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="w-full sm:w-auto pb-4 sm:pb-0 border-b sm:border-b-0 border-lineColor last:border-b-0 last:pb-0">
                  <button className="!text-lg text-white font-medium -tracking-tight flex items-center justify-between gap-5 w-full footer-menu-toggle">
                    Company
                    <img
                      className="block sm:hidden"
                      src="/images/footer-arrow.svg"
                      alt="icon"
                    />
                  </button>
                  <div className="footer-menu-list overflow-hidden">
                    <ul className="flex flex-col gap-2.5 pt-4.5">
                      <li>
                        <Link
                          className="text-offWhite/80 transition-colors duration-300 hover:text-primary"
                          href="/ai-policy"
                        >
                          AI Policy
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="text-offWhite/80 transition-colors duration-300 hover:text-primary"
                          href="/security-and-privacy"
                        >
                          Security &amp; Privacy
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Copyright */}
            <div
              className="mt-4 sm:mt-12 flex items-center justify-center md:justify-between gap-4 flex-col md:flex-row pt-5 lg:pt-6 border-t border-lineColor/50 overflow-hidden relative z-50"
              data-sttr-card=""
            >
              <p className="text-white/80 text-center text-sm">
                © 2026 Scylla. Built for high-velocity teams and seamless
                scheduling.
              </p>
              <div className="flex items-center gap-2 sm:gap-5 flex-wrap sm:flex-nowrap justify-center text-sm">
                <Link
                  className="text-offWhite/80 transition-colors duration-300 hover:text-primary"
                  href="/ai-policy"
                >
                  AI Policy
                </Link>
                <div className="w-[5px] h-[5px] rounded-full bg-offWhite/80"></div>
                <Link
                  className="text-offWhite/80 transition-colors duration-300 hover:text-primary"
                  href="/security-and-privacy"
                >
                  Security &amp; Privacy
                </Link>
              </div>
            </div>

            {/* Giant Footer Watermark */}
            <div
              className="relative overflow-hidden pointer-events-none select-none mt-4 sm:mt-6"
              data-sttr-card=""
            >
              <img
                src="/images/footer-logo.svg"
                alt="Scylla footer watermark"
                className="w-full h-auto select-none"
                data-lag="0.1"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
export { LandingFooter as Footer };
