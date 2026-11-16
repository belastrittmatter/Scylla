import {
  LandingHero,
  LandingAgentCloud,
  LandingStatBand,
  LandingHowItWorks,
  LandingComparison,
  LandingFeatures,
  LandingFaq,
  LandingIntegrations,
} from "@/components/landing";
import { getGitHubRepoStars } from "@/lib/github-stars";

export default async function LandingPage() {
  // Cached for an hour ("use cache"), shared with the layout's header call.
  const stars = await getGitHubRepoStars();
  return (
    <>
      <LandingHero stars={stars} />
      <LandingAgentCloud />
      <LandingStatBand />
      <LandingHowItWorks />
      <LandingComparison />
      <LandingFeatures />
      <LandingFaq />
      <LandingIntegrations />
    </>
  );
}
