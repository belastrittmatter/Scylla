"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RowAction {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}

/** The `···` overflow menu; destructive actions are separated and last. */
export function RowActionsMenu({
  actions,
  label,
}: {
  actions: RowAction[];
  label: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={label} />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((a, i) => (
          <React.Fragment key={a.label}>
            {a.destructive && i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant={a.destructive ? "destructive" : "default"}
              onClick={a.onSelect}
            >
              {a.icon}
              {a.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
