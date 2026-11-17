"use client";

import * as React from "react";
import { UserX } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EntityCombobox } from "@/components/ui/entity-combobox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TaskUser } from "./task-types";
import { getUserAvatarColor } from "./task-utils";

export const GITHUB_NOT_CONNECTED_TOOLTIP =
  "This member has not connected GitHub. They must connect GitHub in Account Settings before they can be assigned tasks in a GitHub-linked project.";

/** Blocked only when the project is linked and GitHub is explicitly not connected. */
export function isAssigneeBlocked(
  user: Pick<TaskUser, "githubConnected">,
  isProjectLinkedToGithub: boolean,
): boolean {
  return isProjectLinkedToGithub && user.githubConnected === false;
}

export function AssigneeGithubBadge({
  user,
  isProjectLinkedToGithub,
}: {
  user: Pick<TaskUser, "githubConnected">;
  isProjectLinkedToGithub: boolean;
}) {
  if (!isProjectLinkedToGithub || user.githubConnected === undefined) {
    return null;
  }
  if (user.githubConnected) {
    return (
      <Badge variant="outline" className="shrink-0 text-[10px]">
        GitHub connected
      </Badge>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="outline"
            title={GITHUB_NOT_CONNECTED_TOOLTIP}
            className="shrink-0 border-destructive/40 text-[10px] text-destructive"
          />
        }
      >
        No GitHub
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {GITHUB_NOT_CONNECTED_TOOLTIP}
      </TooltipContent>
    </Tooltip>
  );
}

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

export function AssigneeOption({
  user,
  isProjectLinkedToGithub = false,
}: {
  user: TaskUser;
  isProjectLinkedToGithub?: boolean;
}) {
  const blocked = isAssigneeBlocked(user, isProjectLinkedToGithub);
  return (
    <span
      className={`flex min-w-0 items-center gap-2.5 ${blocked ? "opacity-60" : ""}`}
      aria-disabled={blocked ? true : undefined}
      title={blocked ? GITHUB_NOT_CONNECTED_TOOLTIP : undefined}
    >
      <UserAvatar user={user} className="size-6 text-xs" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{user.name}</span>
        <span className="text-muted-foreground truncate text-xs">
          {user.role} &bull; {user.email}
        </span>
      </span>
      <AssigneeGithubBadge
        user={user}
        isProjectLinkedToGithub={isProjectLinkedToGithub}
      />
    </span>
  );
}

export interface AssigneeSearchPickerProps {
  users: TaskUser[];
  assigneeId: string;
  onAssigneeChange: (assigneeId: string) => void;
  isProjectLinkedToGithub?: boolean;
}

/** Entity-combobox usage: "unassigned" is the sentinel id. */
export function AssigneeSearchPicker({
  users,
  assigneeId,
  onAssigneeChange,
  isProjectLinkedToGithub = false,
}: AssigneeSearchPickerProps) {
  const linked = isProjectLinkedToGithub;
  return (
    <EntityCombobox
      items={users}
      getKey={(u) => u.id}
      getLabel={(u) => u.name}
      searchFields={(u) => [u.name, u.email, u.role]}
      selected={users.find((u) => u.id === assigneeId) ?? null}
      onSelect={(u) => {
        if (u && isAssigneeBlocked(u, linked)) {
          toast.error(GITHUB_NOT_CONNECTED_TOOLTIP);
          return;
        }
        onAssigneeChange(u?.id ?? "unassigned");
      }}
      placeholder={<span className="text-muted-foreground">Unassigned</span>}
      searchPlaceholder="Search assignees..."
      emptyText="No assignees found."
      clearOption={{
        label: "Unassigned",
        icon: <UserX className="size-4 shrink-0" />,
      }}
      className="w-full bg-transparent"
      contentClassName="w-80"
      renderSelected={(u) => (
        <>
          <UserAvatar user={u} className="size-5 text-xs" />
          <span className="truncate font-medium">{u.name}</span>
          <span className="text-muted-foreground shrink-0 text-xs">
            ({u.role})
          </span>
          <AssigneeGithubBadge user={u} isProjectLinkedToGithub={linked} />
        </>
      )}
      renderItem={(u) => (
        <AssigneeOption user={u} isProjectLinkedToGithub={linked} />
      )}
    />
  );
}
