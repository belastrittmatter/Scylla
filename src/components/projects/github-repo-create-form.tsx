"use client";

import * as React from "react";
import { Lock, Globe, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, slugify } from "@/lib/utils";
import type { GithubRepoValidationResult } from "@/lib/github-validation";

export interface GitHubRepoCreateFormProps {
  ownerLogin: string;
  newRepoName: string;
  suggestedName: string;
  isPrivate: boolean;
  disabled?: boolean;
  effectiveName: string;
  validation: GithubRepoValidationResult;
  onNewRepoNameChange: (v: string) => void;
  onIsPrivateChange: (v: boolean) => void;
}

export function GitHubRepoCreateForm({
  ownerLogin,
  newRepoName,
  suggestedName,
  isPrivate,
  disabled = false,
  effectiveName,
  validation,
  onNewRepoNameChange,
  onIsPrivateChange,
}: GitHubRepoCreateFormProps) {
  return (
    <div className="rounded-md border border-input/60 bg-muted/20 p-3 space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">
          Repository Name
        </label>

        <div className="flex rounded-md shadow-2xs">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted/60 px-2.5 text-xs font-mono text-muted-foreground select-none">
            {ownerLogin}/
          </span>
          <Input
            value={newRepoName}
            placeholder={slugify(suggestedName) || "repo-name"}
            onChange={(e) => onNewRepoNameChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "h-8 rounded-l-none text-xs font-mono focus-visible:ring-1",
              effectiveName &&
                !validation.valid &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
        </div>

        {effectiveName && !validation.valid ? (
          <p className="flex items-center gap-1.5 text-[11px] text-destructive">
            <AlertCircle className="size-3 shrink-0" />
            <span>{validation.error}</span>
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Only alphanumeric characters, hyphens, and periods.
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs pt-0.5">
        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
          <input
            type="radio"
            name="repo-visibility"
            checked={isPrivate}
            onChange={() => onIsPrivateChange(true)}
            disabled={disabled}
            className="size-3.5 accent-primary"
          />
          <Lock className="size-3 text-muted-foreground" />
          <span>Private</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
          <input
            type="radio"
            name="repo-visibility"
            checked={!isPrivate}
            onChange={() => onIsPrivateChange(false)}
            disabled={disabled}
            className="size-3.5 accent-primary"
          />
          <Globe className="size-3 text-muted-foreground" />
          <span>Public</span>
        </label>
      </div>
    </div>
  );
}
