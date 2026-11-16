import type { Metadata } from "next";
import localFont from "next/font/local";
import {
  LandingHeader,
  LandingCtaBanner,
  LandingFooter,
} from "@/components/landing";
import { getGitHubRepoStars } from "@/lib/github-stars";

/**
 * Two-family type system:
 * - STK Bureau Sans (400 / 500 only — never use font-semibold) → body, UI, headlines
 * - Maple Mono NF (Italic + Regular) → eyebrows, accents, terminal
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
      className={`landing ${bureauSans.variable} ${mapleMono.variable} min-h-screen overflow-x-clip selection:bg-ember selection:text-white`}
    >
      <LandingHeader stars={stars} />
      <main>{children}</main>
      <LandingCtaBanner stars={stars} />
      <LandingFooter />
    </div>
  );
}
