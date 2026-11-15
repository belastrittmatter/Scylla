import type { Metadata } from "next";
import localFont from "next/font/local";
import {
  LandingScripts,
  LandingHeader,
  LandingCtaBanner,
  LandingFooter,
  LandingHydrationSentinel,
  LandingScrollTop,
} from "@/components/landing";
import { getGitHubRepoStars } from "@/lib/github-stars";

/**
 * Two-family type system:
 * - STK Bureau Sans (Book / Regular / Book Italic) → body, UI, headlines
 * - Maple Mono NF (Italic + Regular) → emphasis, mono chips, terminal
 */
const bureauSans = localFont({
  src: [
    {
      path: "../../fonts/stk-bureau-sans-book.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/stk-bureau-sans-regular.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/stk-bureau-sans-book-italic.otf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-bureau",
  display: "swap",
});

const mapleMono = localFont({
  src: [
    {
      path: "../../fonts/maple-mono-nf-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../fonts/maple-mono-nf-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-maple",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scylla | AI-Powered Multi-Person Calendar & Room Scheduling",
  description:
    "Autonomous multi-person availability coordinator and physical room scheduling with Model Context Protocol.",
};

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stars = await getGitHubRepoStars();

  return (
    <div
      className={`scylla-landing ${bureauSans.variable} ${mapleMono.variable} min-h-screen bg-white text-[#18181b] selection:bg-primary selection:text-white`}
    >
      <script
        dangerouslySetInnerHTML={{
          __html:
            "if (location.pathname === '/') document.documentElement.classList.add('gsap-pending');",
        }}
      />

      {/* Dynamic GSAP, ScrollSmoother, and interactive scripts */}
      <LandingScripts />

      {/* Sticky header navigation (stars + theme toggle + CTA) */}
      <LandingHeader stars={stars} />

      {/* Smooth scrolling wrapper */}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          {children}
          <LandingCtaBanner />
          <LandingFooter />
          <LandingHydrationSentinel part="shell" />
          <LandingScrollTop />
        </div>
      </div>
    </div>
  );
}
