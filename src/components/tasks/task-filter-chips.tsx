"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TaskFilterDef } from "./task-filter-defs";

interface Chip {
  id: string;
  text: string;
  onRemove: () => void;
}

/** Slim row of removable active-filter chips; renders nothing when no filter or search is set. */
export function TaskFilterChips({
  defs,
  searchQuery,
  onClearSearch,
  onClearAll,
}: {
  defs: TaskFilterDef[];
  searchQuery: string;
  onClearSearch: () => void;
  onClearAll: () => void;
}) {
  const chips: Chip[] = defs
    .filter((d) => d.value !== "all")
    .map((d) => ({
      id: d.label,
      text: `${d.label}: ${d.options.find((o) => o.value === d.value)?.label ?? d.value}`,
      onRemove: () => d.onChange("all"),
    }));
  if (searchQuery) {
    chips.unshift({
      id: "search",
      text: `Search: "${searchQuery}"`,
      onRemove: onClearSearch,
    });
  }
  if (chips.length === 0) return null;

  return (
    <div className="bg-background flex flex-wrap items-center gap-1.5 border-b px-5 py-1.5">
      {chips.map((c) => (
        <Button
          key={c.id}
          variant="secondary"
          size="xs"
          onClick={c.onRemove}
          aria-label={`Remove filter ${c.text}`}
        >
          {c.text}
          <X />
        </Button>
      ))}
      <Button variant="ghost" size="xs" onClick={onClearAll}>
        Clear
      </Button>
    </div>
  );
}
