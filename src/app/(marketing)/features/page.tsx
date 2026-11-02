import type { Metadata } from "next";
import { FeaturesHero } from "@/components/features";
import {
  LandingCalendar,
  LandingTaskBoardPreview,
  LandingProcessSteps,
  LandingUseCases,
  LandingIntegrations,
} from "@/components/landing";

export const metadata: Metadata = {
  title: "Features | Scylla - The AI-Powered Task & Calendar Workspace",
  description:
    "Explore Scylla features: visual time-blocking, two-way Google Calendar sync, interactive Kanban boards, sub-second timers, and Model Context Protocol AI integrations.",
};

export default function FeaturesPage() {
  return (
    <>
      <FeaturesHero />
      <LandingCalendar />
      <LandingTaskBoardPreview />
      <LandingProcessSteps />
      <LandingUseCases />
      <LandingIntegrations />
    </>
  );
}
