import type { Metadata } from "next";
import {
  LandingScripts,
  LandingHeader,
  LandingCtaBanner,
  LandingFooter,
} from "@/components/landing";

export const metadata: Metadata = {
  title: "Scylla | AI-Powered Multi-Person Calendar & Room Scheduling",
  description:
    "Autonomous multi-person availability coordinator and physical room scheduling with Model Context Protocol.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="scylla-landing min-h-screen bg-[#09090b] text-[#FBFBFB] selection:bg-primary selection:text-white">
      {/* Dynamic GSAP, ScrollSmoother, and interactive scripts */}
      <LandingScripts />

      {/* Sticky header navigation */}
      <LandingHeader />

      {/* Smooth scrolling wrapper */}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          {children}
          <LandingCtaBanner />
          <LandingFooter />
        </div>
      </div>
    </div>
  );
}
