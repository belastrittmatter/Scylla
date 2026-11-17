"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { plural } from "@/lib/plural";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddMemberDialog } from "./add-member-dialog";
import { TeamMemberTableRow } from "./team-member-table-row";
import { useTeamMembers } from "./use-team-members";

type Props = {
  teamId: string;
  userId: string;
  canManage: boolean;
  /**
   * When set, renders this as an h2 with the member count under it, on the
   * same row as "Add member". Default: only the count, as on the team page.
   */
  title?: React.ReactNode;
  /** Below `sm`, move each email under the name so Role and actions fit. */
  compactEmail?: boolean;
};

export function TeamMembersTab({
  teamId,
  userId,
  canManage,
  title,
  compactEmail = false,
}: Props) {
  const { members, isLoading, addMember, updateRole, removeMember } =
    useTeamMembers(teamId);
  const [adding, setAdding] = React.useState(false);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex items-center justify-between",
          title !== undefined && "gap-3",
        )}
      >
        {title !== undefined ? (
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm">
              {plural(members.length, "member")}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {plural(members.length, "member")}
          </p>
        )}
        {canManage && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <UserPlus />
            Add member
          </Button>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className={cn(compactEmail && "hidden sm:table-cell")}>
                Email
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TeamMemberTableRow
                key={m.userId}
                member={m}
                canManage={canManage}
                isSelf={m.userId === userId}
                onUpdateRole={updateRole}
                onRemove={removeMember}
                compactEmail={compactEmail}
              />
            ))}
          </TableBody>
        </Table>
      )}
      <AddMemberDialog
        open={adding}
        onOpenChange={setAdding}
        onAdd={addMember}
      />
    </div>
  );
}
