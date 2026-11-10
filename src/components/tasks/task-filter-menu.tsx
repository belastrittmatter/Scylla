"use client";

import * as React from "react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskFilterDef } from "./task-filter-defs";

/** Single Filter button; each filter is a radio submenu. */
export function TaskFilterMenu({ defs }: { defs: TaskFilterDef[] }) {
  const active = defs.filter((d) => d.value !== "all").length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" aria-label="Filter tasks" />}
      >
        <ListFilter />
        <span className="hidden xl:inline">Filter</span>
        {active > 0 && <span className="text-muted-foreground">{active}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {defs.map((d) => (
          <DropdownMenuSub key={d.label}>
            <DropdownMenuSubTrigger>{d.label}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={d.value}
                onValueChange={(v) => d.onChange(String(v))}
              >
                <DropdownMenuRadioItem value="all">
                  {d.allLabel}
                </DropdownMenuRadioItem>
                {d.options.map((o) => (
                  <DropdownMenuRadioItem key={o.value} value={o.value}>
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
