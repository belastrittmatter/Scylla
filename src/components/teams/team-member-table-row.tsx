"use client";

import * as React from "react";
import { toast } from "sonner";
import { ShieldCheck, Trash2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RowActionsMenu } from "@/components/layout/row-actions-menu";
import type { TeamMemberItem } from "@/hooks/use-teams";
import type { TeamRole } from "@/services/team/team-types";
import { getPersonInitials } from "@/lib/format-person-name";
import { ASSIGNABLE_ROLES } from "./team-roles";

type Props = {
  member: TeamMemberItem;
  canManage: boolean;
  isSelf: boolean;
  onUpdateRole: (userId: string, role: TeamRole) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
};

export function TeamMemberTableRow({
  member,
  canManage,
  isSelf,
  onUpdateRole,
  onRemove,
}: Props) {
  const [confirming, setConfirming] = React.useState(false);
  const name = member.user?.name || member.user?.email || member.userId;
  const isOwner = member.role === "owner";
  // Owners can't be demoted or removed (API rejects removing the owner).
  const editable = canManage && !isOwner;
  // Role changes live in the row menu; the badge stays a quiet label.
  const roleActions = ASSIGNABLE_ROLES.filter((r) => r !== member.role).map(
    (r) => ({
      label: `Make ${r}`,
      icon: r === "admin" ? <ShieldCheck /> : <User />,
      onSelect: () => {
        onUpdateRole(member.userId, r).catch((e: Error) =>
          toast.error(e.message),
        );
      },
    }),
  );

  return (
    <TableRow>
      <TableCell className="py-2 pl-4 pr-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar size="sm">
            <AvatarImage src={member.user?.image || undefined} alt={name} />
            <AvatarFallback>{getPersonInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{name}</span>
              {isSelf && <Badge variant="meta">You</Badge>}
            </div>
            {member.user?.email && (
              <p className="text-muted-foreground truncate font-mono text-xs sm:hidden">
                {member.user.email}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground hidden truncate px-3 font-mono text-xs sm:table-cell">
        {member.user?.email}
      </TableCell>
      <TableCell className="px-2 sm:px-3">
        <Badge variant="meta" className="capitalize">
          {member.role}
        </Badge>
      </TableCell>
      <TableCell className="pl-0 pr-2 text-right">
        {editable && (
          <RowActionsMenu
            label={`Actions for ${name}`}
            actions={[
              ...roleActions,
              {
                label: "Remove",
                icon: <Trash2 />,
                destructive: true,
                onSelect: () => setConfirming(true),
              },
            ]}
          />
        )}
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={`Remove ${name}?`}
          description="They will lose access to this team's projects and tasks."
          confirmLabel="Remove"
          onConfirm={() => onRemove(member.userId)}
        />
      </TableCell>
    </TableRow>
  );
}
