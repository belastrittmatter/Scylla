import {
  LandingHero,
  LandingAgentCloud,
  LandingStatBand,
  LandingTaskBoardPreview,
  LandingProcessSteps,
  LandingRegion,
  LandingProductTour,
  LandingComparison,
  LandingCalendar,
  LandingUseCases,
  LandingFaq,
  LandingIntegrations,
  LandingHydrationSentinel,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <>
      <LandingHero />
      <LandingAgentCloud />
      <LandingStatBand />
      <LandingTaskBoardPreview />
      <LandingProcessSteps />
      <LandingRegion />
      <LandingProductTour />
      <LandingComparison />
      <LandingCalendar />
      <LandingUseCases />
      <LandingFaq />
      <LandingIntegrations />
      <LandingHydrationSentinel part="page" />
    </>
  );
}
