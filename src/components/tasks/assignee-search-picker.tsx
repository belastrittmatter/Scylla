"use client";

import { UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EntityCombobox } from "@/components/ui/entity-combobox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "cn";
import { getAssigneeGithubStatus } from "./assignee-github-status";
import type { TaskUser } from "./task-types";
import { getUserAvatarColor } from "./task-utils";

function UserAvatar({
  user,
  className,
}: {
  user: TaskUser;
  className: string;
}) {
  return (
    <Avatar className={`${className} shrink-0`}>
      <AvatarImage src={user.avatarUrl} alt={user.name} />
      <AvatarFallback className={getUserAvatarColor(user.name)}>
        {user.initials || user.name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function NoGithubBadge({ badge, tooltip }: { badge: string; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="outline"
            title={tooltip}
            className="shrink-0 border-amber-500/50 text-amber-600"
          />
        }
      >
        {badge}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

interface AssigneeSearchPickerProps {
  users: TaskUser[];
  assigneeId: string;
  onAssigneeChange: (assigneeId: string) => void;
  requireGithub?: boolean;
  className?: string;
}

/** Searchable assignee select; members without GitHub are flagged and cannot be chosen when GitHub is required. */
export function AssigneeSearchPicker({
  users,
  assigneeId,
  onAssigneeChange,
  requireGithub = false,
  className,
}: AssigneeSearchPickerProps) {
  const statusOf = (u: TaskUser) => getAssigneeGithubStatus(u, requireGithub);
  const badgeOf = (u: TaskUser) => {
    const { badge, tooltip } = statusOf(u);
    return badge && tooltip ? (
      <NoGithubBadge badge={badge} tooltip={tooltip} />
    ) : null;
  };

  return (
    <EntityCombobox
      items={users}
      getKey={(u) => u.id}
      getLabel={(u) => u.name}
      searchFields={(u) => [u.name, u.email, u.role]}
      selected={users.find((u) => u.id === assigneeId) ?? null}
      onSelect={(u) => {
        if (u && statusOf(u).blocked) return;
        onAssigneeChange(u?.id ?? "unassigned");
      }}
      placeholder={<span className="text-muted-foreground">Unassigned</span>}
      searchPlaceholder="Search assignees..."
      emptyText="No assignees found."
      clearOption={{
        label: "Unassigned",
        icon: <UserX className="size-4 shrink-0" />,
      }}
      className={cn("w-full bg-transparent", className)}
      contentClassName="w-80"
      renderSelected={(u) => (
        <>
          <UserAvatar user={u} className="size-5 text-xs" />
          <span className="truncate font-medium">{u.name}</span>
          <span className="text-muted-foreground shrink-0 text-xs">
            ({u.role})
          </span>
          {badgeOf(u)}
        </>
      )}
      renderItem={(u) => (
        <span
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5",
            statusOf(u).blocked && "opacity-60",
          )}
        >
          <UserAvatar user={u} className="size-6 text-xs" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{u.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {u.role} &bull; {u.email}
            </span>
          </span>
          {badgeOf(u)}
        </span>
      )}
    />
  );
}
