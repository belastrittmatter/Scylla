"use client";

import Link from "next/link";
import { LandingGithubStarsBadge } from "@/components/landing/github-stars-badge";
import { LandingThemeToggle } from "@/components/landing/theme-toggle";

export function LandingHeader({ stars }: { stars?: number | null }) {
  return (
    <header
      className="header-area fixed w-full left-0 top-0 right-0 z-[999] border-b border-[#e4e4e7] dark:border-[#27272a] dark:border-[#27272a] backdrop-blur-md"
      data-smooth-ignore="true"
    >
      <div className="container">
        <div className="border-container relative">
          <div className="header-wrapper flex items-center justify-between gap-5 py-4">
            <Link prefetch={false} className="logo flex items-center" href="/">
              <img
                src="/images/logo-dark.svg"
                alt="Scylla logo"
                className="h-7 w-auto dark:hidden"
              />
              <img
                src="/images/logo.svg"
                alt="Scylla logo"
                className="h-7 w-auto hidden dark:block"
              />
            </Link>
            <div className="flex items-center gap-3">
              <LandingGithubStarsBadge stars={stars ?? null} />
              <LandingThemeToggle />
              <Link
                prefetch={false}
                href="/auth/sign-in"
                className="button-primary inline-flex items-center justify-center !py-2.5 px-6 text-sm leading-normal rounded-full"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
