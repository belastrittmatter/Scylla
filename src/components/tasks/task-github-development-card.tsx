"use client";

import * as React from "react";
import { toast } from "sonner";
import type { TaskDevelopmentInfo } from "@/services/github/github-dev-service";
import { copyToClipboard } from "@/lib/clipboard";
import { TaskGithubDevelopmentPanel } from "./task-github-development-panel";
import type { TaskItem } from "./task-types";

export interface TaskGithubDevelopmentCardProps {
  task: TaskItem;
  canEdit: boolean;
  onTaskPatched?: (taskId: string, patch: Partial<TaskItem>) => void;
}

async function errorOf(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

async function fetchInfo(taskId: string): Promise<TaskDevelopmentInfo> {
  const res = await fetch(`/api/tasks/${taskId}/github-dev`);
  if (!res.ok) throw new Error(await errorOf(res, "Failed to load"));
  return (await res.json()) as TaskDevelopmentInfo;
}

function diffPatch(
  task: TaskItem,
  info: TaskDevelopmentInfo,
): Partial<TaskItem> | null {
  const next: Partial<TaskItem> = {
    githubIssueNumber: info.issueNumber,
    githubIssueUrl: info.issueUrl,
    githubBranch: info.branch,
    githubPrNumber: info.pullRequest?.number ?? null,
    githubPrUrl: info.pullRequest?.url ?? null,
    githubPrStatus: info.pullRequest?.state ?? null,
  };
  const changed = (Object.keys(next) as (keyof TaskItem)[]).some(
    (k) => task[k] !== next[k],
  );
  return changed ? next : null;
}

export function TaskGithubDevelopmentCard({
  task,
  canEdit,
  onTaskPatched,
}: TaskGithubDevelopmentCardProps) {
  const [info, setInfo] = React.useState<TaskDevelopmentInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreatingBranch, setIsCreatingBranch] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const taskRef = React.useRef(task);
  const patchRef = React.useRef(onTaskPatched);
  React.useEffect(() => {
    taskRef.current = task;
    patchRef.current = onTaskPatched;
  });
  const taskId = task.id;

  const apply = React.useCallback(
    (data: TaskDevelopmentInfo) => {
      setInfo(data);
      const patch = diffPatch(taskRef.current, data);
      if (patch) patchRef.current?.(taskId, patch);
    },
    [taskId],
  );

  /** Loads and applies fresh info; failures keep the last known info. */
  const load = React.useCallback(async () => {
    try {
      apply(await fetchInfo(taskId));
    } catch {
      // The panel shows "unavailable" when there is no info yet.
    } finally {
      setIsLoading(false);
    }
  }, [apply, taskId]);

  const reload = () => {
    setIsLoading(true);
    void load();
  };

  React.useEffect(() => {
    let ignore = false;
    fetchInfo(taskId)
      .then((data) => {
        if (!ignore) apply(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [apply, taskId]);

  const handleCreateBranch = async () => {
    setIsCreatingBranch(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/github-branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        toast.error(await errorOf(res, "Failed to create branch"));
        return;
      }
      const data = (await res.json()) as {
        branchName: string;
        alreadyExisted: boolean;
      };
      toast.success(
        data.alreadyExisted
          ? `Branch "${data.branchName}" already exists on GitHub`
          : `Branch "${data.branchName}" created on GitHub`,
      );
      setIsLoading(true);
      await load();
    } catch {
      toast.error("Failed to create branch");
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleCopy = async () => {
    if (!info) return;
    const ok = await copyToClipboard(info.checkoutCommand);
    if (!ok) {
      toast.error("Failed to copy command");
      return;
    }
    setCopied(true);
    toast.success("Copied git checkout command");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TaskGithubDevelopmentPanel
      info={info}
      isLoading={isLoading}
      isCreatingBranch={isCreatingBranch}
      copied={copied}
      canEdit={canEdit}
      onCreateBranch={() => void handleCreateBranch()}
      onCopyCommand={() => void handleCopy()}
      onRefresh={reload}
    />
  );
}
