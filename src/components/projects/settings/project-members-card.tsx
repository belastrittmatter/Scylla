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
import { Skeleton } from "@/components/ui/skeleton";
import { AddMemberDialog } from "@/components/teams/add-member-dialog";
import { useTeamMembers } from "@/components/teams/use-team-members";
import { ProjectMemberRow } from "./project-member-row";

type Props = { teamId: string; canManage: boolean };

export function ProjectMembersCard({ teamId, canManage }: Props) {
  const { members, isLoading, addMember, removeMember } =
    useTeamMembers(teamId);
  const [adding, setAdding] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Team Members</h2>
        </CardTitle>
        {canManage && (
          <CardAction>
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
      <ul aria-hidden className="divide-y">
        {[0, 1, 2].map((i) => (
          <li key={i} className="space-y-1.5 py-2.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-44" />
          </li>
        ))}
      </ul>
    </div>
  );
}
