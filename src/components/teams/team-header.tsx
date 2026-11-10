"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RowActionsMenu } from "@/components/layout/row-actions-menu";
import type { TeamItem } from "@/hooks/use-teams";
import { EditTeamDialog } from "./edit-team-dialog";

type Props = {
  team: TeamItem;
  canManage: boolean;
  onUpdate: (
    id: string,
    data: { name?: string; slug?: string; description?: string },
  ) => Promise<TeamItem>;
  onDelete: () => Promise<void>;
};

export function TeamHeader({ team, canManage, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">
          {team.name}
        </h1>
        {team.description && (
          <p className="text-muted-foreground text-sm">{team.description}</p>
        )}
      </div>
      {canManage && (
        <RowActionsMenu
          label="Team actions"
          actions={[
            {
              label: "Edit",
              icon: <Pencil />,
              onSelect: () => setEditing(true),
            },
            {
              label: "Delete",
              icon: <Trash2 />,
              destructive: true,
              onSelect: () => setDeleting(true),
            },
          ]}
        />
      )}
      <EditTeamDialog
        team={team}
        open={editing}
        onOpenChange={setEditing}
        onUpdateTeam={onUpdate}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${team.name}?`}
        description="The team, its projects and memberships are permanently deleted."
        confirmLabel="Delete team"
        onConfirm={onDelete}
      />
    </div>
  );
}
