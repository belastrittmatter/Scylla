import type { Metadata } from "next";

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
      <link id="scylla-landing-css" rel="stylesheet" href="/css/landing.css" />
      {children}
    </div>
  );
}
