import Link from "next/link";
import { LandingLogo } from "@/components/landing/primitives";
import { LandingGithubStarsBadge } from "@/components/landing/github-stars-badge";
import { LandingThemeToggle } from "@/components/landing/theme-toggle";

export function LandingHeader({ stars }: { stars?: number | null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 border-x border-dashed border-line px-5 sm:px-10">
        <Link prefetch={false} href="/" className="shrink-0">
          <LandingLogo />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <LandingGithubStarsBadge stars={stars ?? null} />
          <LandingThemeToggle />
          <Link
            prefetch={false}
            href="/auth/sign-in"
            className="ml-1 inline-flex h-9 items-center rounded-full bg-ink px-4 text-sm font-medium whitespace-nowrap text-paper transition-colors hover:bg-ember hover:text-white"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
