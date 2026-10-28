"use client";

import * as React from "react";
import { Search, X, Check, ChevronDown, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TaskUser } from "./task-types";
import { getUserAvatarColor } from "./task-utils";
import { cn } from "@/lib/utils";

interface AssigneeSearchPickerProps {
  users: TaskUser[];
  assigneeId: string;
  onAssigneeChange: (assigneeId: string) => void;
  disabled?: boolean;
}

export function AssigneeSearchPicker({
  users,
  assigneeId,
  onAssigneeChange,
  disabled = false,
}: AssigneeSearchPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedUser = React.useMemo(
    () => (assigneeId === "unassigned" ? null : users.find((u) => u.id === assigneeId) || null),
    [users, assigneeId]
  );

  const filteredUsers = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  const selectAssignee = (id: string) => {
    onAssigneeChange(id);
    setIsOpen(false);
  };

  const showUnassignedOption =
    !searchQuery || "unassigned".includes(searchQuery.trim().toLowerCase());

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setSearchQuery("");
      }}
    >
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-neutral-200/90 bg-transparent px-3 text-sm outline-none transition-colors dark:border-neutral-800",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedUser ? (
            <>
              <Avatar className="size-5 shrink-0 text-[9px]">
                <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.name} />
                <AvatarFallback className={getUserAvatarColor(selectedUser.name)}>
                  {selectedUser.initials || selectedUser.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                {selectedUser.name}
              </span>
              <span className="shrink-0 text-xs text-neutral-400">({selectedUser.role})</span>
            </>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </div>
        <ChevronDown className="text-muted-foreground pointer-events-none size-4 shrink-0" />
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={4} className="w-80 p-1.5">
        <div className="relative mb-1 px-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search assignees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full pl-8 pr-7 text-xs"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-60 space-y-0.5 overflow-y-auto px-1 py-0.5">
          {showUnassignedOption && (
            <button
              type="button"
              onClick={() => selectAssignee("unassigned")}
              className={cn(
                "hover:bg-accent flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                (!selectedUser || assigneeId === "unassigned") && "bg-accent/60 font-medium"
              )}
            >
              <div className="flex items-center gap-2 text-neutral-500">
                <UserX className="size-4 shrink-0" />
                <span>Unassigned</span>
              </div>
              {(!selectedUser || assigneeId === "unassigned") && (
                <Check className="text-primary size-3.5 shrink-0" />
              )}
            </button>
          )}

          {filteredUsers.map((u) => {
            const isSelected = selectedUser?.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => selectAssignee(u.id)}
                className={cn(
                  "hover:bg-accent flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                  isSelected && "bg-accent/60 font-medium"
                )}
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <Avatar className="size-6 shrink-0 text-[10px]">
                    <AvatarImage src={u.avatarUrl} alt={u.name} />
                    <AvatarFallback className={getUserAvatarColor(u.name)}>
                      {u.initials || u.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate text-left">
                    <span className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                      {u.name}
                    </span>
                    <span className="truncate text-[11px] text-neutral-500">
                      {u.role} &bull; {u.email}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="text-primary size-3.5 shrink-0" />}
              </button>
            );
          })}

          {filteredUsers.length === 0 && !showUnassignedOption && (
            <div className="text-muted-foreground px-2 py-4 text-center text-xs">
              No assignees matching &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
