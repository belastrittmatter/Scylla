import Image from "next/image";
import Link from "next/link";
import { LandingStarButton } from "@/components/landing/github-stars-badge";

const enter =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-700 fill-mode-both";

export function LandingHero({ stars }: { stars?: number | null }) {
  return (
    <section className="px-2 pt-2 selection:bg-[#ffd98a]! selection:text-[#1a1714]! sm:px-3 sm:pt-3">
      <div className="relative isolate mx-auto max-w-[1480px] overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#f2531f_0%,#e8480f_55%,#c63d10_100%)] px-5 pt-14 text-white sm:rounded-[28px] sm:px-10 sm:pt-28">
        <div className="halftone absolute inset-0 -z-10" aria-hidden="true" />
        {/* Warm bloom behind the screenshot */}
        <div
          aria-hidden="true"
          className="absolute -bottom-1/4 left-1/2 -z-10 h-3/4 w-[150%] -translate-x-1/2 bg-[radial-gradient(ellipse_46%_52%_at_50%_100%,rgb(255_226_170)_0%,rgb(255_190_110/0.55)_38%,transparent_72%)]"
        />

        <div className="mx-auto max-w-[820px] text-center">
          <h1
            className={`${enter} text-balance text-[38px] leading-[1.04] font-normal tracking-[-0.03em] sm:text-6xl lg:text-[76px]`}
          >
            Plan the work. Book the meeting. Let your{" "}
            <em className="font-code font-normal tracking-[-0.02em] underline decoration-[#ffd98a]/90 decoration-[0.06em] underline-offset-[0.16em]">
              agents
            </em>{" "}
            do both.
          </h1>
          <p
            className={`${enter} mx-auto mt-5 max-w-[620px] text-pretty text-[15px] leading-relaxed text-white/85 delay-100 sm:mt-6 sm:text-lg`}
          >
            Scylla puts your team calendar, meeting rooms and project boards in
            one place, and ties every meeting to the project it&apos;s for. Run
            it from the app, or from any MCP-capable assistant.
          </p>
          <div
            className={`${enter} mt-7 flex items-center justify-center gap-2.5 delay-200 sm:mt-9 sm:gap-3`}
          >
            <Link
              prefetch={false}
              href="/auth/sign-in"
              className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm whitespace-nowrap sm:h-12 sm:px-7 font-medium text-[#1a1714] shadow-[0_8px_24px_-8px_rgb(90_20_0/0.5)] transition-transform hover:-translate-y-0.5"
            >
              Get started free
            </Link>
            <LandingStarButton stars={stars} />
          </div>
        </div>

        {/* Product screenshot rises out of the panel's bottom edge */}
        <div
          className={`${enter} mx-auto mt-10 max-w-[1040px] delay-300 sm:mt-20`}
        >
          <div className="rounded-t-[14px] border border-b-0 border-white/35 bg-white/15 p-1.5 pb-0 shadow-[0_-18px_60px_rgb(90_20_0/0.28)] sm:p-2 sm:pb-0">
            <div className="max-h-[230px] overflow-hidden rounded-t-[9px] sm:max-h-[360px] lg:max-h-[440px]">
              <Image
                priority
                src="/images/calendar-dashboard-preview.png"
                alt="Scylla's team calendar: a week view with teammates listed beside it"
                width={1591}
                height={991}
                sizes="(min-width: 1040px) 1040px, 100vw"
                className="block h-auto w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
