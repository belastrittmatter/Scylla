"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { plural } from "@/lib/plural";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TeamMemberItem } from "@/hooks/use-teams";
import { AddMemberDialog } from "./add-member-dialog";
import { TeamMemberTableRow } from "./team-member-table-row";
import { useTeamMembers } from "./use-team-members";

type Props = {
  teamId: string;
  userId: string;
  canManage: boolean;
  /** Reports the loaded member count (for the page header). */
  onCountChange?: (count: number) => void;
};

/** Rows shown before "Show all"; keeps the toolbar in reach on big teams. */
const PAGE_SIZE = 25;
/** The filter only earns its space once the list is long enough to scan. */
const FILTER_THRESHOLD = 10;

const HEAD = "text-muted-foreground h-9 px-3 font-mono text-xs font-normal";

function matches(member: TeamMemberItem, query: string) {
  const q = query.toLowerCase();
  return (
    (member.user?.name ?? "").toLowerCase().includes(q) ||
    (member.user?.email ?? "").toLowerCase().includes(q)
  );
}

export function TeamMembersTab({
  teamId,
  userId,
  canManage,
  onCountChange,
}: Props) {
  const { members, isLoading, addMember, updateRole, removeMember } =
    useTeamMembers(teamId);
  const [adding, setAdding] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading) onCountChange?.(members.length);
  }, [isLoading, members.length, onCountChange]);

  const trimmed = query.trim();
  const filtered = trimmed
    ? members.filter((m) => matches(m, trimmed))
    : members;
  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE);
  const hidden = filtered.length - visible.length;

  return (
    <div className="space-y-3">
      <div className="flex min-h-7 flex-wrap items-center gap-2">
        <p className="text-muted-foreground mr-auto font-mono text-xs tabular-nums">
          {isLoading
            ? " "
            : trimmed
              ? `${filtered.length} of ${plural(members.length, "member")}`
              : plural(members.length, "member")}
        </p>
        {members.length > FILTER_THRESHOLD && (
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name or email"
            aria-label="Filter members"
            className="order-last h-7 w-full sm:order-none sm:w-56"
          />
        )}
        {canManage && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <UserPlus />
            Add member
          </Button>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`${HEAD} pl-4`}>Name</TableHead>
                <TableHead className={`${HEAD} hidden w-[38%] sm:table-cell`}>
                  Email
                </TableHead>
                <TableHead className={`${HEAD} w-20 px-2 sm:w-24 sm:px-3`}>
                  Role
                </TableHead>
                <TableHead className={`${HEAD} w-10`}>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((m) => (
                <TeamMemberTableRow
                  key={m.userId}
                  member={m}
                  canManage={canManage}
                  isSelf={m.userId === userId}
                  onUpdateRole={updateRole}
                  onRemove={removeMember}
                />
              ))}
              {visible.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground h-16 px-4 text-center whitespace-normal"
                  >
                    No members match &ldquo;{trimmed}&rdquo;.{" "}
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="text-foreground underline underline-offset-4"
                    >
                      Clear filter
                    </button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {hidden > 0 && (
            <div className="border-t px-2 py-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground w-full"
                onClick={() => setShowAll(true)}
              >
                Show all {plural(filtered.length, "member")}
              </Button>
            </div>
          )}
        </div>
      )}
      <AddMemberDialog
        open={adding}
        onOpenChange={setAdding}
        onAdd={addMember}
      />
    </div>
  );
}
