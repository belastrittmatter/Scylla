import Link from "next/link";
import { ChevronRight, FolderKanban, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TeamItem } from "@/hooks/use-teams";
import { plural } from "@/lib/plural";

export function TeamRow({ team }: { team: TeamItem }) {
  return (
    <li>
      <Link
        href={`/teams/${team.slug}`}
        className="hover:bg-muted/50 flex items-center gap-4 px-4 py-3 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{team.name}</p>
          <p className="text-muted-foreground truncate font-mono text-xs">
            /{team.slug}
          </p>
        </div>
        <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
          <Users className="size-3.5" />
          {plural(team.memberCount ?? 0, "member")}
        </span>
        <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
          <FolderKanban className="size-3.5" />
          {plural(team.projectCount ?? 0, "project")}
        </span>
        {team.role && (
          <Badge variant="outline" className="capitalize">
            {team.role}
          </Badge>
        )}
        <ChevronRight className="text-muted-foreground size-4" />
      </Link>
    </li>
  );
}
