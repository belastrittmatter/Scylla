"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { TeamMemberItem } from "@/hooks/use-teams";

type Props = {
  member: TeamMemberItem;
  canManage: boolean;
  onRemove: (userId: string) => Promise<void>;
};

/** One member in the project settings list; Remove asks first, like the team page. */
export function ProjectMemberRow({ member, canManage, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  // Same fallback as the team page's row, so a missing name never leaves a blank line.
  const name = member.user?.name || member.user?.email || member.userId;
  const email = member.user?.email;
  const isOwner = member.role === "owner";

  // ConfirmDialog keeps itself open and toasts the error if this throws.
  const remove = async () => {
    setRemoving(true);
    try {
      await onRemove(member.userId);
      toast.success("Member removed");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <li className="flex items-center gap-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        {email && email !== name && (
          <span className="text-muted-foreground block truncate text-xs">
            {email}
          </span>
        )}
      </span>
      <span className="text-muted-foreground shrink-0 text-xs capitalize">
        {member.role}
      </span>
      {canManage && (
        // Fixed trailing cell on every row so the role labels share one edge.
        <span className="flex w-20 shrink-0 justify-end">
          {!isOwner && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive -me-2.5"
                aria-label={`Remove ${name}`}
                disabled={removing}
                onClick={() => setConfirming(true)}
              >
                Remove
              </Button>
              <ConfirmDialog
                open={confirming}
                onOpenChange={setConfirming}
                title={`Remove ${name}?`}
                description="They will lose access to this team's projects and tasks."
                confirmLabel="Remove member"
                onConfirm={remove}
              />
            </>
          )}
        </span>
      )}
    </li>
  );
}
