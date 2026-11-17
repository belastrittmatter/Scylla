"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddMemberDialog } from "@/components/teams/add-member-dialog";
import { useTeamMembers } from "@/components/teams/use-team-members";
import { ProjectMemberRow } from "./project-member-row";
import { MemberSkeletonRows } from "./project-settings-skeleton";

type Props = { teamId: string; canManage: boolean };

export function ProjectMembersCard({ teamId, canManage }: Props) {
  const { members, isLoading, addMember, removeMember } =
    useTeamMembers(teamId);
  const [adding, setAdding] = useState(false);

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>
          <h2>Team Members</h2>
        </CardTitle>
        {canManage && (
          // One row, centred with the title (CardAction defaults to two rows, top-aligned).
          <CardAction className="row-span-1 self-center">
            <Button size="sm" onClick={() => setAdding(true)}>
              <UserPlus />
              Add member
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <MembersSkeleton />
        ) : members.length === 0 ? (
          // A failed load only toasts; keep saying so after the toast fades.
          <p className="text-muted-foreground text-sm">No members to show.</p>
        ) : (
          <ul className="divide-y">
            {members.map((m) => (
              <ProjectMemberRow
                key={m.userId}
                member={m}
                canManage={canManage}
                onRemove={removeMember}
              />
            ))}
          </ul>
        )}
      </CardContent>
      {canManage && (
        <AddMemberDialog
          open={adding}
          onOpenChange={setAdding}
          onAdd={addMember}
        />
      )}
    </Card>
  );
}

/** Three rows shaped like the real ones, so the card keeps its height while loading. */
function MembersSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading members…</span>
      <MemberSkeletonRows />
    </div>
  );
}
