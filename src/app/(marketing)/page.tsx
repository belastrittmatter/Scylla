import {
  LandingHero,
  LandingTaskBoardPreview,
  LandingProcessSteps,
  LandingCalendar,
  LandingUseCases,
  LandingIntegrations,
  LandingTestimonials,
  LandingPricing,
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
      <LandingTestimonials />
      <LandingPricing />
    </>
  );
}
