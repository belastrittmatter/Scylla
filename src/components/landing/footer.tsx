"use client";

import * as React from "react";
import Link from "next/link";

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
      { label: "Multi-Person Teams", href: "/teams", isDashboardLink: true },
    ],
  },
  {
    title: "Resources",
    links: [
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
];

const LEGAL_LINKS: FooterLinkItem[] = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of use", href: "/terms" },
  { label: "AI & MCP policy", href: "/ai-policy" },
];

/**
 * Footer layout mirrors the Cloudflare reference: logo left, link columns
 * right, dashed rule, then a bottom bar with copyright and inline legal
 * links separated by pipes.
 */
export function LandingFooter() {
  return (
    <footer className="bg-transparent">
      <div className="container">
        <div className="border-container pt-14 sm:pt-18 lg:pt-24 pb-6 sm:pb-8">
          <div className="flex items-start justify-between gap-10 flex-col lg:flex-row">
            {/* Logo column */}
            <div className="lg:max-w-[280px] w-full">
              <img
                src="/images/logo-dark.svg"
                alt="Scylla logo"
                className="h-6 w-auto dark:hidden"
              />
              <img
                src="/images/logo.svg"
                alt="Scylla logo"
                className="h-6 w-auto hidden dark:block"
              />
            </div>

            {/* Link columns */}
            <div className="lg:max-w-[640px] w-full grid grid-cols-2 sm:grid-cols-2 gap-x-8 gap-y-10">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.title} className="footer-menu-wrapper">
                  <button className="!text-sm text-[#71717a] dark:text-[#a1a1aa] font-medium w-full text-left footer-menu-toggle">
                    {column.title}
                  </button>
                  <div className="footer-menu-list overflow-hidden">
                    <ul className="flex flex-col gap-2.5 pt-4">
                      {column.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            prefetch={false}
                            className="text-[#3f3f46] dark:text-[#d4d4d8] transition-colors duration-300 hover:text-primary text-sm cursor-pointer"
                            href={link.href}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="footer-rule mt-10 sm:mt-14 pt-5 flex flex-wrap items-center justify-center sm:justify-between gap-3 overflow-hidden relative z-50">
            <p className="text-[#71717a] dark:text-[#a1a1aa] text-sm">
              © 2026 Scylla. Built for high-velocity teams and seamless
              scheduling.
            </p>
            <div className="flex items-center justify-center gap-3 text-sm">
              {LEGAL_LINKS.map((link, index) => (
                <React.Fragment key={link.label}>
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-[#d4d4d8] dark:text-[#3f3f46]"
                    >
                      |
                    </span>
                  )}
                  <Link
                    prefetch={false}
                    className="text-[#3f3f46] dark:text-[#d4d4d8] transition-colors duration-300 hover:text-primary cursor-pointer"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
