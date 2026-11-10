"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, RefreshCw, Plus } from "lucide-react";
import type { TaskItem } from "./task-types";
import type { TaskDevelopmentInfo } from "@/services/github/github-integration-service";
import { copyToClipboard } from "@/lib/clipboard";
import { TaskGithubBranchSection } from "./task-github-branch-section";
import { TaskGithubPrSection } from "./task-github-pr-section";

interface TaskGithubDevelopmentCardProps {
  task: TaskItem;
  onTaskUpdated?: (updated: TaskItem) => void;
}

export function TaskGithubDevelopmentCard({
  task,
  onTaskUpdated,
}: TaskGithubDevelopmentCardProps) {
  const [devInfo, setDevInfo] = useState<TaskDevelopmentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [copied, setCopied] = useState(false);

  const syncTaskFromDevInfo = React.useCallback(
    (info: TaskDevelopmentInfo) => {
      let hasChanges = false;
      let nextStatus = task.status;
      let nextPrNumber = task.githubPrNumber;
      let nextPrUrl = task.githubPrUrl;
      let nextPrStatus = task.githubPrStatus;

      if (info.pullRequest) {
        if (info.pullRequest.state === "merged" && task.status !== "done") {
          nextStatus = "done";
          hasChanges = true;
        }
        if (task.githubPrNumber !== info.pullRequest.number) {
          nextPrNumber = info.pullRequest.number;
          hasChanges = true;
        }
        if (task.githubPrUrl !== info.pullRequest.url) {
          nextPrUrl = info.pullRequest.url;
          hasChanges = true;
        }
        if (task.githubPrStatus !== info.pullRequest.state) {
          nextPrStatus = info.pullRequest.state;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        onTaskUpdated?.({
          ...task,
          status: nextStatus,
          githubPrNumber: nextPrNumber,
          githubPrUrl: nextPrUrl,
          githubPrStatus: nextPrStatus,
        });
      }
    },
    [task, onTaskUpdated],
  );

  const fetchDevInfo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/github-dev`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDevInfo(json.data);
          syncTaskFromDevInfo(json.data);
        }
      }
    } catch {
      // Ignore background fetch error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/tasks/${task.id}/github-dev`);
        if (!ignore && res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setDevInfo(json.data);
            syncTaskFromDevInfo(json.data);
          }
        }
      } catch {
        // ignore background fetch error
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [task.id, syncTaskFromDevInfo]);

  const handleCopyCommand = async (cmd: string) => {
    const ok = await copyToClipboard(cmd);
    if (ok) {
      setCopied(true);
      toast.success("Copied checkout command to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy command");
    }
  };

  const handleCreateBranch = async () => {
    setIsCreatingBranch(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/github-branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchName: devInfo?.suggestedBranch,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create branch on GitHub");
      } else {
        toast.success(
          json.data.alreadyExisted
            ? `Branch "${json.data.branchName}" already existed on GitHub!`
            : json.data.linkedToIssue
              ? `Created & linked branch "${json.data.branchName}" to Issue #${json.data.issueNumber}!`
              : `Created branch "${json.data.branchName}" on GitHub!`,
        );
        const updatedTask: TaskItem = {
          ...task,
          githubBranch: json.data.branchName,
          githubIssueNumber: json.data.issueNumber || task.githubIssueNumber,
          status: task.status === "todo" ? "in_progress" : task.status,
        };
        onTaskUpdated?.(updatedTask);
        void fetchDevInfo();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating branch");
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleCreateIssue = async () => {
    setIsCreatingIssue(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/github-issue`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create issue on GitHub");
      } else {
        toast.success(`Created GitHub issue #${json.data.number}!`);
        const updatedTask: TaskItem = {
          ...task,
          githubIssueNumber: json.data.number,
          githubIssueUrl: json.data.url,
          githubBranch: json.data.branchName,
        };
        onTaskUpdated?.(updatedTask);
        void fetchDevInfo();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating issue");
    } finally {
      setIsCreatingIssue(false);
    }
  };

  const repo = devInfo?.repository || task.project?.githubRepo;
  if (!repo && !task.githubIssueNumber) {
    return null;
  }

  // devInfo branch if present, fallback to task.githubBranch
  const branch = devInfo?.branch || task.githubBranch || null;
  const isBranchOnRemote =
    devInfo?.isBranchOnRemote ?? Boolean(devInfo?.branch);
  const suggestedBranch =
    devInfo?.suggestedBranch ||
    (task.githubIssueNumber ? `feat/#${task.githubIssueNumber}` : "feat/task");
  const checkoutCmd =
    devInfo?.checkoutCommand ||
    (branch
      ? isBranchOnRemote
        ? `git checkout ${branch}`
        : `git checkout -b ${branch}`
      : `git checkout -b ${suggestedBranch}`);

  return (
    <Card className="gap-2.5 py-3 text-xs bg-muted/30 border-border/70 shadow-2xs">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between pb-0 px-3.5">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <svg className="size-3.5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
          </svg>
          <span className="text-xs font-semibold">Development</span>
          {repo && (
            <span className="font-mono text-[11px] text-muted-foreground font-normal truncate max-w-[140px]">
              ({repo})
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-foreground"
          title="Refresh development status"
          disabled={isLoading}
          onClick={() => void fetchDevInfo()}
        >
          <RefreshCw className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3 px-3.5 pt-1">
        {/* GitHub Issue item */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Issue:</span>
          {task.githubIssueNumber ? (
            <a
              href={
                task.githubIssueUrl ||
                `https://github.com/${repo}/issues/${task.githubIssueNumber}`
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs font-medium text-primary hover:underline"
            >
              #{task.githubIssueNumber}
              <ExternalLink className="size-2.5" />
            </a>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2 gap-1"
              disabled={isCreatingIssue}
              onClick={handleCreateIssue}
            >
              <Plus className="size-2.5" />
              <span>{isCreatingIssue ? "Creating..." : "Create Issue"}</span>
            </Button>
          )}
        </div>

        <Separator />

        {/* Branch Section */}
        <TaskGithubBranchSection
          branch={branch}
          suggestedBranch={suggestedBranch}
          isBranchOnRemote={isBranchOnRemote}
          repo={repo ?? null}
          checkoutCmd={checkoutCmd}
          copied={copied}
          isCreatingBranch={isCreatingBranch}
          onCopyCommand={(cmd) => void handleCopyCommand(cmd)}
          onCreateBranch={handleCreateBranch}
        />

        {/* Pull Request Section */}
        <TaskGithubPrSection
          task={task}
          devInfo={devInfo}
          repo={repo ?? null}
          branch={branch}
          isBranchOnRemote={isBranchOnRemote}
        />
      </CardContent>
    </Card>
  );
}
