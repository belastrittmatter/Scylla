import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TeamItem } from "@/hooks/use-teams";
import { plural } from "@/lib/plural";

export function TeamRow({ team }: { team: TeamItem }) {
  return (
    <li>
      <Link
        href={`/teams/${team.slug}`}
        className="hover:bg-muted/50 focus-visible:ring-ring/50 flex items-center gap-4 px-4 py-3 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-inset"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{team.name}</p>
          <p className="text-muted-foreground truncate font-mono text-xs">
            /{team.slug}
          </p>
        </div>
        <span className="text-muted-foreground hidden font-mono text-xs tabular-nums sm:inline">
          {plural(team.memberCount ?? 0, "member")} ·{" "}
          {plural(team.projectCount ?? 0, "project")}
        </span>
        {team.role && (
          <Badge variant="meta" className="capitalize">
            {team.role}
          </Badge>
        )}
        <ChevronRight aria-hidden className="text-muted-foreground size-4" />
      </Link>
    </li>
  );
}
