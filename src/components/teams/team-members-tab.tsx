"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
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
};

export function TeamMembersTab({ teamId, userId, canManage }: Props) {
  const { members, isLoading, addMember, updateRole, removeMember } =
    useTeamMembers(teamId);
  const [adding, setAdding] = React.useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {plural(members.length, "member")}
        </p>
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
              <TableHead>Email</TableHead>
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
