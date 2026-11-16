import { Check } from "lucide-react";
import { ChaosPile } from "@/components/landing/chaos-pile";
import {
  CornerTicks,
  Section,
  SectionHeading,
} from "@/components/landing/primitives";

export function LandingComparison() {
  return (
    <Section className="border-t">
      <SectionHeading
        center
        index="02"
        eyebrow="Why Scylla"
        title="One meeting shouldn't need five tools."
      />

      <div className="reveal relative mt-14 grid gap-px border border-line bg-line lg:grid-cols-2">
        <CornerTicks />

        <div className="bg-surface p-7 sm:p-10">
          <h3 className="text-2xl font-medium tracking-[-0.02em] text-ink sm:text-[32px]">
            Without
          </h3>
          <ChaosPile />
        </div>

        <div className="relative isolate flex flex-col overflow-hidden selection:bg-[#ffd98a]! selection:text-[#1a1714]! bg-[linear-gradient(180deg,#f2531f_0%,#d9440f_100%)] p-7 text-white sm:p-10">
          <div
            className="halftone absolute inset-0 -z-10 opacity-60"
            aria-hidden="true"
          />
          <h3 className="text-2xl font-medium tracking-[-0.02em] sm:text-[32px]">
            With Scylla
          </h3>
          <div className="flex flex-1 items-center justify-center py-12">
            <p className="flex items-center gap-3 rounded-full border border-white/30 bg-white/12 py-2 pr-5 pl-2 text-sm backdrop-blur-sm sm:text-base">
              <span className="flex size-7 items-center justify-center rounded-full bg-white text-ember">
                <Check className="size-4" aria-hidden="true" />
              </span>
              Booked, room reserved, linked to the project
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
