"use client";

import * as React from "react";
import { GitBranch, ExternalLink, Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface TaskGithubBranchSectionProps {
  branch: string | null;
  suggestedBranch: string;
  isBranchOnRemote: boolean;
  repo: string | null;
  checkoutCmd: string;
  copied: boolean;
  isCreatingBranch: boolean;
  onCopyCommand: (cmd: string) => void;
  onCreateBranch: () => void;
}

export function TaskGithubBranchSection({
  branch,
  suggestedBranch,
  isBranchOnRemote,
  repo,
  checkoutCmd,
  copied,
  isCreatingBranch,
  onCopyCommand,
  onCreateBranch,
}: TaskGithubBranchSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <GitBranch className="size-3.5" />
          Branch:
        </span>
        {branch ? (
          <div className="flex items-center gap-1.5 min-w-0">
            {isBranchOnRemote && repo ? (
              <a
                href={`https://github.com/${repo}/tree/${encodeURIComponent(branch)}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] font-medium text-foreground hover:underline flex items-center gap-1 truncate max-w-[190px]"
                title={`View branch "${branch}" on GitHub`}
              >
                <span className="truncate">{branch}</span>
                <ExternalLink className="size-2.5 shrink-0 text-muted-foreground" />
              </a>
            ) : (
              <span
                className="font-mono text-[11px] font-medium text-foreground truncate max-w-[170px]"
                title={`Branch: ${branch}`}
              >
                {branch}
              </span>
            )}
          </div>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] text-muted-foreground font-normal"
          >
            No branch created yet
          </Badge>
        )}
      </div>

      {!branch && suggestedBranch && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Suggested:</span>
          <span
            className="font-mono truncate max-w-[170px]"
            title={suggestedBranch}
          >
            {suggestedBranch}
          </span>
        </div>
      )}

      {/* Checkout command & Action buttons */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-[11px] flex-1 justify-start font-mono text-muted-foreground hover:text-foreground truncate"
          onClick={() => onCopyCommand(checkoutCmd)}
          title="Copy git checkout command"
        >
          {copied ? (
            <Check className="size-3 text-emerald-600 shrink-0 mr-1" />
          ) : (
            <Copy className="size-3 text-muted-foreground shrink-0 mr-1" />
          )}
          <span className="truncate">{checkoutCmd}</span>
        </Button>

        {!isBranchOnRemote && (
          <Button
            type="button"
            variant={branch ? "outline" : "default"}
            size="sm"
            className="h-7 text-[11px] px-2.5 shrink-0"
            disabled={isCreatingBranch}
            onClick={onCreateBranch}
            title={
              branch
                ? "Create this branch on GitHub remote"
                : "Create branch on GitHub"
            }
          >
            {isCreatingBranch
              ? "Creating..."
              : branch
                ? "Create on GitHub"
                : "Create branch"}
          </Button>
        )}
      </div>
    </div>
  );
}
