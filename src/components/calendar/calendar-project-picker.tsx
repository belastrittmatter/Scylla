"use client";

import * as React from "react";
import { FolderGit2, Search, X, Check, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface ProjectOption {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  teamId: string;
  teamName?: string | null;
}

export interface CalendarProjectPickerProps {
  value?: string | null;
  onChange: (projectId: string | null, project?: ProjectOption | null) => void;
  disabled?: boolean;
}

export function CalendarProjectPicker({
  value,
  onChange,
  disabled = false,
}: CalendarProjectPickerProps) {
  const [projects, setProjects] = React.useState<ProjectOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    let ignore = false;
    apiClient.projects
      .list()
      .then((data) => {
        if (!ignore && Array.isArray(data)) setProjects(data);
      })
      .catch((err) =>
        console.warn("Failed to fetch projects for calendar picker:", err),
      )
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const selectedProject = React.useMemo(
    () => projects.find((p) => p.id === value) || null,
    [projects, value],
  );

  const filteredProjects = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.teamName && p.teamName.toLowerCase().includes(q)),
    );
  }, [projects, searchQuery]);

  const selectOption = (projectId: string | null) => {
    const chosen = projects.find((p) => p.id === projectId) || null;
    onChange(projectId, chosen);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Link to Project (Optional)</Label>
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setSearchQuery("");
        }}
      >
        <PopoverTrigger
          type="button"
          disabled={disabled || isLoading}
          className={cn(
            "border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "dark:bg-input/30 dark:hover:bg-input/50 flex h-8 w-full select-none items-center justify-between",
            "gap-1.5 rounded-lg border bg-transparent px-2.5 text-xs outline-none transition-colors",
            "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {selectedProject ? (
            <div className="flex items-center gap-2 truncate">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: selectedProject.color || "#3b82f6" }}
              />
              <span className="truncate font-medium">
                {selectedProject.name}
              </span>
              {selectedProject.teamName && (
                <span className="text-muted-foreground truncate text-[11px] font-normal">
                  ({selectedProject.teamName})
                </span>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 truncate">
              <FolderGit2 className="size-3.5 shrink-0" />
              <span>
                {isLoading
                  ? "Loading projects..."
                  : "Personal Event (No project)"}
              </span>
            </div>
          )}
          <ChevronDown className="text-muted-foreground pointer-events-none size-4 shrink-0" />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className="min-w-(--anchor-width) w-80 p-1.5"
        >
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
            {(!searchQuery ||
              "personal event no project".includes(
                searchQuery.toLowerCase(),
              )) && (
              <button
                type="button"
                onClick={() => selectOption(null)}
                className={cn(
                  "hover:bg-accent flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                  !value && "bg-accent/60 font-medium",
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderGit2 className="text-muted-foreground size-3.5 shrink-0" />
                  <span>Personal Event (No project)</span>
                </div>
                {!value && <Check className="text-primary size-3.5 shrink-0" />}
              </button>
            )}

            {filteredProjects.map((proj) => {
              const isSelected = value === proj.id;
              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => selectOption(proj.id)}
                  className={cn(
                    "hover:bg-accent flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                    isSelected && "bg-accent/60 font-medium",
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: proj.color || "#3b82f6" }}
                    />
                    <span className="truncate">{proj.name}</span>
                    {proj.teamName && (
                      <span className="text-muted-foreground truncate text-[11px]">
                        · {proj.teamName}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="text-primary size-3.5 shrink-0" />
                  )}
                </button>
              );
            })}

            {filteredProjects.length === 0 && searchQuery && (
              <div className="text-muted-foreground px-2 py-4 text-center text-xs">
                No projects matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
