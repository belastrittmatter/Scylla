"use client";

import Link from "next/link";

export function LandingHeader() {
  return (
    <header
      className="header-area fixed w-full left-0 top-0 right-0 z-[999] border-b border-lineColor bg-[#09090b]/90 backdrop-blur-md"
      data-smooth-ignore="true"
    >
      <div className="container">
        <div className="border-container relative">
          <div className="header-wrapper flex items-center justify-between gap-5 py-4">
            <Link prefetch={false} className="logo flex items-center" href="/">
              <img
                src="/images/logo.svg"
                alt="Scylla logo"
                className="h-7 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                prefetch={false}
                href="/auth/sign-in"
                className="button-secondary !inline-flex !py-2.5 px-5 text-sm leading-normal"
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
