import Link from "next/link";
import { LandingStarButton } from "@/components/landing/github-stars-badge";

export function LandingCtaBanner({ stars }: { stars?: number | null }) {
  return (
    <section>
      <div className="mx-auto max-w-[1200px] border-x border-dashed border-line px-5 pb-20 sm:px-10 sm:pb-28">
        <div className="reveal relative isolate overflow-hidden rounded-[24px] selection:bg-[#ffd98a]! selection:text-[#1a1714]! bg-[linear-gradient(135deg,#f2531f_0%,#e8480f_50%,#b8390e_100%)] px-6 py-14 text-white sm:px-14 sm:py-20">
          <div className="halftone absolute inset-0 -z-10" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="absolute -right-1/4 -bottom-1/2 -z-10 size-[640px] rounded-full bg-[radial-gradient(circle,rgb(255_217_138/0.55),transparent_65%)]"
          />
          <h2 className="max-w-[640px] text-balance text-4xl leading-[1.05] font-normal tracking-[-0.03em] sm:text-6xl">
            Give your agents a{" "}
            <em className="font-code font-normal tracking-[-0.02em] underline decoration-[#ffd98a]/90 decoration-[0.06em] underline-offset-[0.16em]">
              calendar
            </em>
            .
          </h2>
          <p className="mt-5 max-w-[480px] text-pretty leading-relaxed text-white/85">
            Connect Google Calendar, invite your team, start a project and let
            the next &ldquo;when are you free?&rdquo; answer itself.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              prefetch={false}
              href="/auth/sign-in"
              className="inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-medium text-[#1a1714] shadow-[0_8px_24px_-8px_rgb(90_20_0/0.5)] transition-transform hover:-translate-y-0.5"
            >
              Get started free
            </Link>
            <LandingStarButton stars={stars} />
          </div>
        </div>
      </div>
    </section>
  );
}
