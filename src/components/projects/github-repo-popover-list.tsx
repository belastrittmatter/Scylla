"use client";

import * as React from "react";
import { Search, X, Check, Lock, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GitHubRepositoryItem } from "@/services/github/github-sync-service";

export interface GitHubRepoPopoverListProps {
  value: string;
  searchQuery: string;
  filteredRepos: GitHubRepositoryItem[];
  onSearchChange: (q: string) => void;
  onSelect: (repoFullName: string) => void;
}

export function GitHubRepoPopoverList({
  value,
  searchQuery,
  filteredRepos,
  onSearchChange,
  onSelect,
}: GitHubRepoPopoverListProps) {
  return (
    <>
      <div className="flex items-center border-b border-border/80 px-2.5 py-1.5">
        <Search className="size-3.5 text-muted-foreground shrink-0 mr-2" />
        <Input
          placeholder="Search repository..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-7 border-0 bg-transparent px-0 text-xs focus-visible:ring-0 shadow-none"
          autoFocus
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      <div className="max-h-60 overflow-y-auto p-1 text-xs">
        <button
          type="button"
          onClick={() => onSelect("")}
          className={cn(
            "flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left transition-colors hover:bg-accent/60",
            !value && "bg-accent/40 font-semibold text-primary",
          )}
        >
          <span className="text-muted-foreground italic">
            None (no GitHub integration)
          </span>
          {!value && <Check className="size-3 text-primary" />}
        </button>

        {filteredRepos.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            {searchQuery ? "No matching repositories" : "No repositories found"}
          </div>
        ) : (
          filteredRepos.map((repo) => (
            <button
              key={repo.id}
              type="button"
              onClick={() => onSelect(repo.fullName)}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left transition-colors hover:bg-accent/60",
                value === repo.fullName &&
                  "bg-accent/40 font-semibold text-primary",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {repo.isPrivate ? (
                    <Lock className="size-3 text-amber-500 shrink-0" />
                  ) : (
                    <Globe className="size-3 text-blue-500 shrink-0" />
                  )}
                  <span className="font-mono text-xs truncate">
                    {repo.fullName}
                  </span>
                </div>
                {repo.description && (
                  <p className="truncate text-[11px] text-muted-foreground pl-4.5">
                    {repo.description}
                  </p>
                )}
              </div>
              {value === repo.fullName && (
                <Check className="size-3 text-primary shrink-0 ml-1.5" />
              )}
            </button>
          ))
        )}
      </div>
    </>
  );
}
