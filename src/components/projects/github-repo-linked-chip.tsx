"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";

export interface GitHubRepoLinkedChipProps {
  value: string;
  mode: "select" | "create";
  isConnected: boolean | null;
  isLoading: boolean;
  repoCount: number;
}

export function GitHubRepoLinkedChip({
  value,
  mode,
  isConnected,
  isLoading,
  repoCount,
}: GitHubRepoLinkedChipProps) {
  return (
    <>
      {value && mode === "select" && (
        <div className="flex items-center justify-between rounded-md border border-neutral-200/90 bg-neutral-50/80 px-2.5 py-1 text-xs dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center gap-1.5 min-w-0">
            <Check className="size-3 text-emerald-500 shrink-0" />
            <span className="text-[11px] text-muted-foreground">Linked:</span>
            <span className="font-mono text-xs font-semibold text-foreground truncate">
              {value}
            </span>
          </div>
          <a
            href={`https://github.com/${value}`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-primary hover:underline flex items-center gap-0.5 shrink-0 ml-2"
          >
            <span>View</span>
            <ExternalLink className="size-2.5" />
          </a>
        </div>
      )}

      {isConnected === false && !isLoading && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <span>💡 GitHub not connected:</span>
          <Link
            href="/account/settings"
            target="_blank"
            className="text-primary hover:underline inline-flex items-center gap-0.5 font-medium"
          >
            Connect in Settings
            <ExternalLink className="size-2.5" />
          </Link>
          <span>to select or create GitHub repositories.</span>
        </p>
      )}

      {isConnected && repoCount > 0 && mode === "select" && !value && (
        <p className="text-[11px] text-muted-foreground">
          {repoCount} repositories available in your GitHub account.
        </p>
      )}
    </>
  );
}
