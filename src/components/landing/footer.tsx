"use client";

import * as React from "react";
import Link from "next/link";
import { HardLink } from "./hard-link";

interface FooterLinkItem {
  label: string;
  href: string;
  isDashboardLink?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Smart Calendar", href: "/calendar", isDashboardLink: true },
      { label: "Task Kanban Board", href: "/tasks", isDashboardLink: true },
      {
        label: "Time Tracking & Analytics",
        href: "/tasks",
        isDashboardLink: true,
      },
      {
        label: "Projects & Backlogs",
        href: "/projects",
        isDashboardLink: true,
      },
      { label: "Multi-Person Teams", href: "/teams", isDashboardLink: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Features Overview", href: "/features" },
      { label: "Pricing Plans", href: "#pricing" },
      {
        label: "MCP AI Integrations",
        href: "/calendar",
        isDashboardLink: true,
      },
      {
        label: "Documentation & Support",
        href: "/support",
        isDashboardLink: true,
      },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Model Context Protocol Policy", href: "/ai-policy" },
    ],
  },
];

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
                  <h2 className="text-[25px]">Stay in the Flow</h2>
                  <p className="mt-3 sm:mt-4 text-offWhite/80 text-sm">
                    Subscribe for the latest product releases, MCP agent
                    updates, and deep-work strategies.
                  </p>
                </div>
              </div>

              {/* Navigation Columns */}
              <div className="lg:max-w-[560px] w-full flex items-start justify-between gap-4 sm:gap-10 flex-col sm:flex-row footer-menu-wrapper">
                {FOOTER_COLUMNS.map((column) => (
                  <div
                    key={column.title}
                    className="w-full sm:w-auto pb-4 sm:pb-0 border-b sm:border-b-0 border-lineColor last:border-b-0 last:pb-0"
                  >
                    <button className="!text-lg text-white font-medium -tracking-tight flex items-center justify-between gap-5 w-full footer-menu-toggle">
                      {column.title}
                      <img
                        className="block sm:hidden"
                        src="/images/footer-arrow.svg"
                        alt="icon"
                      />
                    </button>
                    <div className="footer-menu-list overflow-hidden">
                      <ul className="flex flex-col gap-2.5 pt-4.5">
                        {column.links.map((link) => (
                          <li key={link.label}>
                            <HardLink
                              className="text-offWhite/80 transition-colors duration-300 hover:text-primary cursor-pointer"
                              href={link.href}
                            >
                              {link.label}
                            </HardLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
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
                <HardLink
                  className="text-offWhite/80 transition-colors duration-300 hover:text-primary"
                  href="/privacy"
                >
                  Privacy Policy
                </HardLink>
                <div className="w-[5px] h-[5px] rounded-full bg-offWhite/80"></div>
                <HardLink
                  className="text-offWhite/80 transition-colors duration-300 hover:text-primary"
                  href="/terms"
                >
                  Terms of Service
                </HardLink>
                <div className="w-[5px] h-[5px] rounded-full bg-offWhite/80"></div>
                <HardLink
                  className="text-offWhite/80 transition-colors duration-300 hover:text-primary"
                  href="/ai-policy"
                >
                  AI Policy
                </HardLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
