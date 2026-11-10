"use client";

import * as React from "react";
import { FolderGit2, Plus, Lock, Globe, X, ChevronDown } from "lucide-react";
import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { GitHubRepositoryItem } from "@/services/github/github-sync-service";

export interface GitHubRepoSelectModeProps {
  mode: "select" | "create";
  isConnected: boolean | null;
  disabled?: boolean;
  isLoading: boolean;
  value: string;
  selectedRepo?: GitHubRepositoryItem | null;
  onSwitchMode: (mode: "select" | "create") => void;
  onClear: () => void;
}

export function GitHubRepoModeToggle({
  mode,
  isConnected,
  onSwitchMode,
}: {
  mode: "select" | "create";
  isConnected: boolean | null;
  onSwitchMode: (mode: "select" | "create") => void;
}) {
  if (!isConnected) return null;
  return (
    <div className="flex items-center gap-1 rounded-md border border-input bg-muted/40 p-0.5 text-xs">
      <button
        type="button"
        onClick={() => onSwitchMode("select")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded py-1 px-2 font-medium transition-colors",
          mode === "select"
            ? "bg-background text-foreground shadow-2xs font-semibold"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <FolderGit2 className="size-3" />
        <span>Select existing repo</span>
      </button>
      <button
        type="button"
        onClick={() => onSwitchMode("create")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded py-1 px-2 font-medium transition-colors",
          mode === "create"
            ? "bg-background text-foreground shadow-2xs font-semibold"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Plus className="size-3" />
        <span>Create new repo</span>
      </button>
    </div>
  );
}

export function GitHubRepoSelectTrigger({
  disabled,
  isLoading,
  isConnected,
  value,
  selectedRepo,
  onClear,
}: {
  disabled?: boolean;
  isLoading: boolean;
  isConnected: boolean | null;
  value: string;
  selectedRepo?: GitHubRepositoryItem | null;
  onClear: () => void;
}) {
  return (
    <PopoverTrigger
      type="button"
      disabled={disabled || isLoading || isConnected === false}
      className={cn(
        "flex h-9 w-full flex-1 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-2xs transition-colors hover:bg-accent/40 focus:outline-hidden focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        !value && "text-muted-foreground",
      )}
    >
      <div className="flex items-center gap-2 truncate">
        {selectedRepo ? (
          <>
            {selectedRepo.isPrivate ? (
              <Lock className="size-3 text-amber-500 shrink-0" />
            ) : (
              <Globe className="size-3 text-blue-500 shrink-0" />
            )}
            <span className="font-mono text-xs font-medium text-foreground truncate">
              {selectedRepo.fullName}
            </span>
          </>
        ) : value ? (
          <span className="font-mono text-xs font-medium text-foreground truncate">
            {value}
          </span>
        ) : (
          <span>Select GitHub repository (optional)...</span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={onClear}
            onKeyDown={(e) => e.key === "Enter" && onClear()}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            title="Clear repository selection"
          >
            <X className="size-3" />
          </span>
        )}
        <ChevronDown className="size-3.5 text-muted-foreground opacity-60" />
      </div>
    </PopoverTrigger>
  );
}
