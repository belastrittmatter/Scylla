"use client";

import { UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EntityCombobox } from "@/components/ui/entity-combobox";
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

interface AssigneeComboboxProps {
  users: TaskUser[];
  assigneeId: string;
  onAssigneeChange: (assigneeId: string) => void;
}

/** Thin entity-combobox usage: "unassigned" is the sentinel id. */
export function AssigneeCombobox({
  users,
  assigneeId,
  onAssigneeChange,
}: AssigneeComboboxProps) {
  return (
    <EntityCombobox
      items={users}
      getKey={(u) => u.id}
      getLabel={(u) => u.name}
      searchFields={(u) => [u.name, u.email, u.role]}
      selected={users.find((u) => u.id === assigneeId) ?? null}
      onSelect={(u) => onAssigneeChange(u?.id ?? "unassigned")}
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
        </>
      )}
      renderItem={(u) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <UserAvatar user={u} className="size-6 text-xs" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{u.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {u.role} &bull; {u.email}
            </span>
          </span>
        </span>
      )}
    />
  );
}
