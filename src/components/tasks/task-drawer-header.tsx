"use client";

import * as React from "react";
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface TaskDrawerHeaderProps {
  isDraft: boolean;
}

export function TaskDrawerHeader({ isDraft }: TaskDrawerHeaderProps) {
  return (
    <DrawerHeader className="border-b border-border p-0 pb-3 text-left">
      <DrawerTitle className="text-lg font-semibold text-foreground">
        {isDraft ? "Create Task" : "Task Details"}
      </DrawerTitle>
      <DrawerDescription className="text-xs text-muted-foreground">
        {isDraft
          ? "Enter task details, priority, assignee, and target deadline."
          : "Update task metadata, priority, assignee, and target deadline."}{" "}
        Press{" "}
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-muted-foreground">
          ⌘+Enter
        </kbd>{" "}
        to save.
      </DrawerDescription>
    </DrawerHeader>
  );
}
