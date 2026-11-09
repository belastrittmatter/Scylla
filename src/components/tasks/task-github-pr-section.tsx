"use client";

import * as React from "react";
import { GitPullRequest, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { TaskItem } from "./task-types";
import type { TaskDevelopmentInfo } from "@/services/github/github-integration-service";

export interface TaskGithubPrSectionProps {
  task: TaskItem;
  devInfo: TaskDevelopmentInfo | null;
  repo: string | null;
  branch: string | null;
  isBranchOnRemote: boolean;
}

export function TaskGithubPrSection({
  task,
  devInfo,
  repo,
  branch,
  isBranchOnRemote,
}: TaskGithubPrSectionProps) {
  if (devInfo?.pullRequest) {
    const pr = devInfo.pullRequest;
    const badgeClass =
      pr.state === "merged"
        ? "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300"
        : pr.state === "open"
          ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "bg-muted text-muted-foreground border-border";

    return (
      <>
        <Separator />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <GitPullRequest className="size-3.5" />
            Pull Request:
          </span>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-[10px] uppercase font-semibold px-1.5 py-0 ${badgeClass}`}
            >
              {pr.state}
            </Badge>
            <a
              href={pr.url}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              #{pr.number}
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        </div>
      </>
    );
  }

  if (isBranchOnRemote && branch && repo) {
    const prBody = task.githubIssueNumber
      ? `Closes #${task.githubIssueNumber}\n\n${task.description || ""}`
      : task.description || "";
    const compareUrl = `https://github.com/${repo}/compare/${encodeURIComponent(branch)}?expand=1&title=${encodeURIComponent(task.title)}&body=${encodeURIComponent(prBody)}`;

    return (
      <>
        <Separator />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <GitPullRequest className="size-3.5" />
            Pull Request:
          </span>
          <a
            href={compareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            title="Create Pull Request on GitHub with linked issue"
          >
            <span>Open Pull Request</span>
            <ExternalLink className="size-2.5" />
          </a>
        </div>
      </>
    );
  }

  return null;
}
