"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "cn";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RowActionsMenu } from "@/components/layout/row-actions-menu";
import type { TeamMemberItem } from "@/hooks/use-teams";
import type { TeamRole } from "@/services/team/team-types";
import { getPersonInitials } from "@/lib/format-person-name";
import { RoleSelect } from "./role-select";

type Props = {
  member: TeamMemberItem;
  canManage: boolean;
  isSelf: boolean;
  onUpdateRole: (userId: string, role: TeamRole) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  /** Below `sm`, show the email under the name instead of in its own column. */
  compactEmail?: boolean;
};

export function TeamMemberTableRow({
  member,
  canManage,
  isSelf,
  onUpdateRole,
  onRemove,
  compactEmail = false,
}: Props) {
  const [confirming, setConfirming] = React.useState(false);
  const name = member.user?.name || member.user?.email || member.userId;
  const isOwner = member.role === "owner";
  // Owners can't be demoted or removed (API rejects removing the owner).
  const editable = canManage && !isOwner;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src={member.user?.image || undefined} alt={name} />
            <AvatarFallback>{getPersonInitials(name)}</AvatarFallback>
          </Avatar>
          {compactEmail ? (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{name}</span>
                {isSelf && <Badge variant="outline">You</Badge>}
              </div>
              {member.user?.email && (
                <div className="text-muted-foreground truncate text-xs sm:hidden">
                  {member.user.email}
                </div>
              )}
            </div>
          ) : (
            <>
              <span className="font-medium">{name}</span>
              {isSelf && <Badge variant="outline">You</Badge>}
            </>
          )}
        </div>
      </TableCell>
      <TableCell
        className={cn(
          "text-muted-foreground",
          compactEmail && "hidden sm:table-cell",
        )}
      >
        {member.user?.email}
      </TableCell>
      <TableCell>
        {editable ? (
          <RoleSelect
            value={member.role}
            aria-label={`Role for ${name}`}
            onChange={(r) =>
              onUpdateRole(member.userId, r).catch((e: Error) =>
                toast.error(e.message),
              )
            }
          />
        ) : (
          <Badge variant="secondary" className="capitalize">
            {member.role}
          </Badge>
        )}
      </TableCell>
      <TableCell className="w-10 text-right">
        {editable && (
          <RowActionsMenu
            label={`Actions for ${name}`}
            actions={[
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
