"use client";

import * as React from "react";
import { Search, X, Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Team } from "@/db/schema";
import { cn } from "@/lib/utils";

interface TeamSearchPickerProps {
  teams: Team[];
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
  disabled?: boolean;
}

export function TeamSearchPicker({
  teams,
  selectedTeamId,
  onSelectTeam,
  disabled = false,
}: TeamSearchPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedTeam = React.useMemo(
    () => teams.find((t) => t.id === selectedTeamId) || null,
    [teams, selectedTeamId]
  );

  const filteredTeams = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [teams, searchQuery]);

  const selectTeam = (teamId: string) => {
    onSelectTeam(teamId);
    setIsOpen(false);
  };

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
          "flex h-9 min-w-[210px] items-center justify-between gap-2 rounded-lg border border-neutral-200/90 bg-neutral-50/90 px-3 text-sm font-semibold text-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <span className="truncate">{selectedTeam ? selectedTeam.name : "Select Team"}</span>
        <ChevronDown className="text-muted-foreground pointer-events-none size-4 shrink-0" />
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={4} className="w-72 p-1.5">
        <div className="relative mb-1 px-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search teams..."
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

        <div className="max-h-56 space-y-0.5 overflow-y-auto px-1 py-0.5">
          {filteredTeams.map((t) => {
            const isSelected = t.id === selectedTeamId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTeam(t.id)}
                className={cn(
                  "hover:bg-accent flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                  isSelected && "bg-accent/60 font-medium"
                )}
              >
                <div className="flex flex-col truncate pr-2">
                  <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                    {t.name}
                  </span>
                  {t.description && (
                    <span className="line-clamp-1 text-[11px] text-neutral-500">
                      {t.description}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="text-primary size-3.5 shrink-0" />}
              </button>
            );
          })}

          {filteredTeams.length === 0 && searchQuery && (
            <div className="text-muted-foreground px-2 py-4 text-center text-xs">
              No teams matching &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
