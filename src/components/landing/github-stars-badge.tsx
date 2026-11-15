import { Star } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/github-stars";

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
      className="button-secondary cursor-pointer !py-3.5 px-6 text-sm inline-flex items-center justify-center gap-2"
      aria-label={label}
    >
      <Star className="size-4 fill-current" aria-hidden="true" />
      {stars === null ? "GitHub" : formatStarCount(stars)}
    </a>
  );
}
