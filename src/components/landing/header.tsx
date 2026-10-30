"use client";

import * as React from "react";
import Link from "next/link";
import { HardLink } from "./hard-link";

export function LandingHeader() {
  return (
    <header
      className="header-area fixed w-full left-0 top-0 right-0 z-[999] border-b border-lineColor bg-[#09090b]/90 backdrop-blur-md"
      data-smooth-ignore="true"
    >
      <div className="container">
        <div className="border-container">
          <div className="header-wrapper flex items-center justify-between gap-5 relative py-3 lg:py-0">
            <Link className="logo flex items-center" href="/">
              <img
                src="/images/logo.svg"
                alt="Scylla logo"
                className="h-7 w-auto"
              />
            </Link>
            <div className="main-menu">
              <ul>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <HardLink href="/tasks">Tasks</HardLink>
                </li>
                <li>
                  <HardLink href="/calendar">Calendar</HardLink>
                </li>
                <li>
                  <Link href="#pricing">Pricing</Link>
                </li>
                <li className="block sm:hidden">
                  <HardLink
                    href="/calendar"
                    className="button-secondary !inline-flex !py-2.5 px-5 text-sm leading-normal text-center !justify-center"
                  >
                    Open Calendar
                  </HardLink>
                </li>
              </ul>
            </div>
            <div className="flex items-center gap-4">
              <HardLink
                href="/auth/sign-in"
                className="text-sm font-medium text-offWhite/80 hover:text-white transition-colors hidden sm:inline-block px-3 py-2"
              >
                Sign In
              </HardLink>
              <div className="hidden sm:block">
                <HardLink
                  href="/calendar"
                  className="button-secondary !inline-flex !py-2.5 px-5 text-sm leading-normal"
                >
                  Open Calendar
                </HardLink>
              </div>
              {/* Hamburger */}
              <button className="menuToggle" aria-label="Toggle Navigation">
                <svg
                  className="stroke-current text-white"
                  width="40"
                  viewBox="0 0 100 100"
                >
                  <path
                    className="line line1"
                    d="M 20,29.000046 H 80.000231 C 80.000231,29.000046 94.498839,28.817352 94.532987,66.711331 94.543142,77.980673 90.966081,81.670246 85.259173,81.668997 79.552261,81.667751 75.000211,74.999942 75.000211,74.999942 L 25.000021,25.000058"
                  />
                  <path className="line line2" d="M 20,50 H 80" />
                  <path
                    className="line line3"
                    d="M 20,70.999954 H 80.000231 C 80.000231,70.999954 94.498839,71.182648 94.532987,33.288669 94.543142,22.019327 90.966081,18.329754 85.259173,18.331003 79.552261,18.332249 75.000211,25.000058 75.000211,25.000058 L 25.000021,74.999942"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
