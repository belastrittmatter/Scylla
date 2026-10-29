"use client";

import * as React from "react";
import { Search, X, Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Project } from "@/db/schema";
import { cn } from "@/lib/utils";

interface ProjectSearchPickerProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  disabled?: boolean;
}

export function ProjectSearchPicker({
  projects,
  selectedProjectId,
  onSelectProject,
  disabled = false,
}: ProjectSearchPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const activeProject = React.useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  const filteredProjects = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [projects, searchQuery]);

  const selectProject = (projectId: string) => {
    onSelectProject(projectId);
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
          "flex h-9 min-w-[230px] items-center justify-between gap-2 rounded-lg border border-neutral-200/90 bg-neutral-50/90 px-3 text-sm font-semibold text-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {projects.length === 0 ? (
            <span className="text-muted-foreground truncate">
              No projects yet
            </span>
          ) : activeProject ? (
            <>
              <span
                className="shadow-xs size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: activeProject.color || "#3b82f6" }}
              />
              <span className="truncate">{activeProject.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground truncate">
              Select Project
            </span>
          )}
        </div>
        <ChevronDown className="text-muted-foreground pointer-events-none size-4 shrink-0" />
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={4} className="w-80 p-1.5">
        <div className="relative mb-1 px-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search projects..."
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
          {filteredProjects.map((p) => {
            const isSelected = p.id === selectedProjectId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProject(p.id)}
                className={cn(
                  "hover:bg-accent flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                  isSelected && "bg-accent/60 font-medium",
                )}
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color || "#3b82f6" }}
                  />
                  <div className="flex flex-col truncate">
                    <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                      {p.name}
                    </span>
                    {p.description && (
                      <span className="line-clamp-1 text-[11px] text-neutral-500">
                        {p.description}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check className="text-primary size-3.5 shrink-0" />
                )}
              </button>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="text-muted-foreground px-2 py-4 text-center text-xs">
              No projects matching &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
