"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddMemberDialog } from "@/components/teams/add-member-dialog";
import { useTeamMembers } from "@/components/teams/use-team-members";

type Props = { teamId: string; canManage: boolean };

export function ProjectMembersCard({ teamId, canManage }: Props) {
  const { members, isLoading, addMember, removeMember } =
    useTeamMembers(teamId);
  const [adding, setAdding] = useState(false);

  const remove = async (userId: string) => {
    try {
      await removeMember(userId);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team Members</CardTitle>
        {canManage && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <UserPlus />
            Add Member
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading members…</p>
        ) : (
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {m.user?.name}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {m.user?.email}
                  </span>
                </span>
                <span className="text-muted-foreground text-xs capitalize">
                  {m.role}
                </span>
                {canManage && m.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(m.userId)}
                  >
                    Remove
                  </Button>
                )}
              </li>
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
