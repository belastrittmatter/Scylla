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
      className="stars-pill inline-flex items-center justify-center gap-1.5"
      aria-label={label}
    >
      <Star
        className="size-3.5 fill-[#ea580c] text-[#ea580c]"
        aria-hidden="true"
      />
      {stars === null ? "GitHub" : formatStarCount(stars)}
    </a>
  );
}
