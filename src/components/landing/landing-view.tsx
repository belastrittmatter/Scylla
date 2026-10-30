"use client";

import { LandingScripts } from "./landing-scripts";
import { LandingHeader } from "./header";
import { LandingHero } from "./hero";
import { LandingAboutVideo } from "./about-video";
import { LandingProcessSteps } from "./process-steps";
import { LandingUseCases } from "./use-cases";
import { LandingIntegrations } from "./integrations";
import { LandingTestimonials } from "./testimonials";
import { LandingPricing } from "./pricing";
import { LandingCtaBanner } from "./cta-banner";
import { LandingFooter } from "./footer";

export function LandingView() {
  return (
    <div className="scylla-landing">
      {/* Dynamic GSAP, ScrollSmoother, and interactive scripts */}
      <LandingScripts />

      {/* Sticky header navigation */}
      <LandingHeader />

      {/* Smooth scrolling wrapper */}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <LandingHero />
          <LandingAboutVideo />
          <LandingProcessSteps />
          <LandingUseCases />
          <LandingIntegrations />
          <LandingTestimonials />
          <LandingPricing />
          <LandingCtaBanner />
          <LandingFooter />
        </div>
      </div>
    </div>
  );
}
