import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ListHead } from "@/components/ui/list-head";
import type { TeamItem } from "@/hooks/use-teams";
import { plural } from "@/lib/plural";

/** Column widths shared by the head and the rows so the columns line up. */
const COUNTS_COL = "w-48 shrink-0";
const ROLE_COL = "w-16 shrink-0";

export function TeamListHead() {
  return (
    <ListHead>
      <span className="min-w-0 flex-1">Team</span>
      <span className={`${COUNTS_COL} hidden sm:block`}>
        Members · Projects
      </span>
      <span className={ROLE_COL}>Role</span>
      <span aria-hidden className="size-4 shrink-0" />
    </ListHead>
  );
}

export function TeamRow({ team }: { team: TeamItem }) {
  const counts = `${plural(team.memberCount ?? 0, "member")} · ${plural(team.projectCount ?? 0, "project")}`;
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
          {/* Below sm the counts get their own line so neither value is cut off. */}
          <p className="text-muted-foreground font-mono text-xs tabular-nums sm:hidden">
            {counts}
          </p>
        </div>
        <span
          className={`${COUNTS_COL} text-muted-foreground hidden font-mono text-xs tabular-nums sm:block`}
        >
          {counts}
        </span>
        <span className={ROLE_COL}>
          {team.role && (
            <Badge variant="meta" className="capitalize">
              {team.role}
            </Badge>
          )}
        </span>
        <ChevronRight
          aria-hidden
          className="text-muted-foreground size-4 shrink-0"
        />
      </Link>
    </li>
  );
}
