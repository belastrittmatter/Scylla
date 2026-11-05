import {
  LandingHero,
  LandingTaskBoardPreview,
  LandingProcessSteps,
  LandingCalendar,
  LandingUseCases,
  LandingIntegrations,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <>
      <LandingHero />
      <LandingTaskBoardPreview />
      <LandingProcessSteps />
      <LandingCalendar />
      <LandingUseCases />
      <LandingIntegrations />
    </>
  );
}
