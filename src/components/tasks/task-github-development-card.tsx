"use client";

import * as React from "react";
import { Copy, ExternalLink, GitBranch, GitPullRequest } from "lucide-react";
import { toast } from "sonner";
import {
  createTaskBranchAction,
  createTaskIssueAction,
  getTaskDevelopmentAction,
} from "@/actions";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import type { TaskDevelopmentInfo } from "@/services/github/github-types";
import { prStatusLabel } from "./task-github-summary";
import type { TaskItem } from "./task-types";

interface TaskGithubDevelopmentCardProps {
  task: TaskItem;
  readOnly?: boolean;
  initialInfo?: TaskDevelopmentInfo | null;
}

const linkProps = { target: "_blank", rel: "noopener noreferrer" } as const;

export function TaskGithubDevelopmentCard({
  task,
  readOnly,
  initialInfo,
}: TaskGithubDevelopmentCardProps) {
  const [info, setInfo] = React.useState<TaskDevelopmentInfo | null>(
    initialInfo ?? null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<"issue" | "branch" | null>(null);

  React.useEffect(() => {
    if (initialInfo) return;
    let active = true;
    void getTaskDevelopmentAction(task.id).then((res) => {
      if (!active) return;
      if (res.success && res.data) setInfo(res.data);
      else setError(res.error ?? "Could not load GitHub development info");
    });
    return () => {
      active = false;
    };
  }, [task.id, initialInfo]);

  const createIssue = async () => {
    setBusy("issue");
    const res = await createTaskIssueAction(task.id);
    setBusy(null);
    const created = res.data;
    if (!res.success || !created) {
      toast.error(res.error ?? "Could not create the GitHub issue");
      return;
    }
    setInfo((prev) =>
      prev
        ? { ...prev, issueNumber: created.number, issueUrl: created.url }
        : prev,
    );
  };

  const createBranch = async () => {
    setBusy("branch");
    const res = await createTaskBranchAction(task.id);
    setBusy(null);
    const created = res.data;
    if (!res.success || !created) {
      toast.error(res.error ?? "Could not create the branch");
      return;
    }
    setInfo((prev) =>
      prev
        ? {
            ...prev,
            branch: created.branch,
            checkoutCommand: created.checkoutCommand,
          }
        : prev,
    );
  };

  const copyCommand = async (command: string) => {
    if (await copyToClipboard(command))
      toast.success("Checkout command copied");
    else toast.error("Could not copy the checkout command");
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-xs">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <GitBranch className="size-4 text-muted-foreground" />
        Development
      </div>
      {error ? (
        <p className="text-destructive">{error}</p>
      ) : !info ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {info.issueNumber != null ? (
              <a
                href={info.issueUrl ?? undefined}
                {...linkProps}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {`#${info.issueNumber}`}
                <ExternalLink className="size-3" />
              </a>
            ) : (
              <>
                <span className="text-muted-foreground">
                  No GitHub issue yet
                </span>
                {!readOnly && (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={busy === "issue"}
                    onClick={() => void createIssue()}
                  >
                    Create issue
                  </Button>
                )}
              </>
            )}
          </div>

          {info.branch ? (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">{info.branch}</span>
              {info.checkoutCommand && (
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded bg-muted px-1.5 py-1 font-mono">
                    {info.checkoutCommand}
                  </code>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    aria-label="Copy checkout command"
                    onClick={() => void copyCommand(info.checkoutCommand!)}
                  >
                    <Copy />
                    Copy
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {info.suggestedBranch}
              </span>
              {!readOnly && (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={busy === "branch"}
                  onClick={() => void createBranch()}
                >
                  Create branch
                </Button>
              )}
            </div>
          )}

          {info.pullRequest ? (
            <a
              href={info.pullRequest.url}
              data-pr-status={info.pullRequest.state}
              {...linkProps}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <GitPullRequest className="size-3.5" />
              {`PR #${info.pullRequest.number}`}
              <span className="text-muted-foreground">
                {prStatusLabel(info.pullRequest.state)}
              </span>
            </a>
          ) : (
            <span className="text-muted-foreground">
              No linked pull request
            </span>
          )}
        </>
      )}
    </div>
  );
}
