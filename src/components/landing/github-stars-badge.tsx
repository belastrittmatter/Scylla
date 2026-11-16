import { Star } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/github-repo";

function formatStarCount(count: number): string {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(count);
}

export function LandingGithubStarsBadge({ stars }: { stars: number | null }) {
  const label =
    stars === null
      ? "View Scylla on GitHub"
      : `${formatStarCount(stars)} stars on GitHub`;

  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 font-code text-xs text-ink-2 transition-colors hover:text-ink"
    >
      <Star className="size-3.5 fill-ember text-ember" aria-hidden="true" />
      {stars === null ? "GitHub" : formatStarCount(stars)}
    </a>
  );
}

/** Outlined "Star on GitHub" pill for the orange panels (hero, CTA). */
export function LandingStarButton({ stars }: { stars?: number | null }) {
  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center gap-2 rounded-full border border-white/40 px-5 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-white/10 sm:h-12 sm:px-6"
    >
      <Star className="size-4" aria-hidden="true" />
      Star on GitHub
      {typeof stars === "number" && (
        <span className="font-code text-xs text-white/70">
          {formatStarCount(stars)}
        </span>
      )}
    </a>
  );
}
