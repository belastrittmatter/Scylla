"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2 } from "lucide-react";
import type { TeamMemberItem } from "@/hooks/use-teams";
import type { TeamRole } from "@/services/team/team-types";

interface TeamMemberRowProps {
  member: TeamMemberItem;
  onUpdateRole: (userId: string, role: TeamRole) => void;
  onRemoveMember: (userId: string) => void;
}

export function TeamMemberRow({
  member,
  onUpdateRole,
  onRemoveMember,
}: TeamMemberRowProps) {
  const name = member.user?.name || member.user?.email || member.userId;
  const email =
    member.user?.email || (member.userId.includes("@") ? member.userId : "");
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center justify-between rounded-lg border p-2.5 text-xs">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar className="size-7 shrink-0">
          <AvatarImage src={member.user?.image || undefined} alt={name} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 truncate">
          <div className="flex items-center gap-1.5">
            <p className="text-foreground truncate font-medium">{name}</p>
            {member.isNew && (
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 px-1 py-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
              >
                New
              </Badge>
            )}
          </div>
          {email && (
            <p className="text-muted-foreground truncate text-[11px]">
              {email}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {member.role === "owner" ? (
          <Badge variant="secondary" className="py-0 text-[10px] capitalize">
            Owner
          </Badge>
        ) : (
          <Select
            value={member.role}
            onValueChange={(val) =>
              val && onUpdateRole(member.userId, val as TeamRole)
            }
          >
            <SelectTrigger className="h-7 w-24 text-[11px] capitalize">
              <SelectValue>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        )}
        {member.role !== "owner" && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-6"
            onClick={() => onRemoveMember(member.userId)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
