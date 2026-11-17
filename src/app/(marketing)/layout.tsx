import type { Metadata } from "next";
import {
  LandingHeader,
  LandingCtaBanner,
  LandingFooter,
} from "@/components/landing";
import { getGitHubRepoStars } from "@/lib/github-stars";
import { mapleMono } from "@/fonts/maple";

/**
 * Two-family type system:
 * - Inter (from the root layout, --font-sans) → body, UI, headlines
 * - Maple Mono NF (Italic + Regular, src/fonts/maple.ts) → eyebrows, accents, terminal
 */

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
      className={`landing ${mapleMono.variable} min-h-screen overflow-x-clip selection:bg-ember selection:text-white`}
    >
      <LandingHeader stars={stars} />
      <main>{children}</main>
      <LandingCtaBanner stars={stars} />
      <LandingFooter />
    </div>
  );
}
