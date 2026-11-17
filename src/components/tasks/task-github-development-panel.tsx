import * as React from "react";
import {
  Check,
  Copy,
  GitBranch,
  GitPullRequest,
  RefreshCw,
} from "lucide-react";
import type { TaskDevelopmentInfo } from "@/services/github/github-dev-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPrStatusLabel } from "./task-github-badges";

export interface TaskGithubDevelopmentPanelProps {
  info: TaskDevelopmentInfo | null;
  isLoading: boolean;
  isCreatingBranch: boolean;
  copied: boolean;
  canEdit: boolean;
  onCreateBranch: () => void;
  onCopyCommand: () => void;
  onRefresh: () => void;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-foreground">{children}</span>
    </div>
  );
}

const LINK = "font-medium text-primary hover:underline";

function PanelBody(
  props: TaskGithubDevelopmentPanelProps & { info: TaskDevelopmentInfo },
) {
  const { info, canEdit, copied, isCreatingBranch } = props;
  const pr = info.pullRequest;
  return (
    <div className="flex flex-col gap-2">
      {info.repository && (
        <p className="text-xs text-muted-foreground">{info.repository}</p>
      )}
      <Row label="Issue">
        {info.issueNumber != null && info.issueUrl ? (
          <a
            href={info.issueUrl}
            target="_blank"
            rel="noreferrer"
            className={LINK}
          >
            {`#${info.issueNumber}`}
          </a>
        ) : info.issueNumber != null ? (
          `#${info.issueNumber}`
        ) : (
          "No issue yet"
        )}
      </Row>
      <Row label="Branch">
        {info.branch ? (
          <span className="inline-flex items-center gap-1">
            <GitBranch className="size-3" />
            {info.branch}
          </span>
        ) : (
          <>
            No branch yet{" "}
            <span className="text-muted-foreground">
              {`Suggested: ${info.suggestedBranch}`}
            </span>
          </>
        )}
      </Row>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
          {info.checkoutCommand}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          aria-label="Copy git checkout command"
          onClick={props.onCopyCommand}
        >
          {copied ? (
            <Check className="mr-1 size-3" />
          ) : (
            <Copy className="mr-1 size-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      {canEdit && !info.isBranchOnRemote && (
        <Button
          type="button"
          size="sm"
          className="h-7 self-start px-3 text-xs"
          disabled={isCreatingBranch}
          onClick={props.onCreateBranch}
        >
          {isCreatingBranch ? "Creating…" : "Create branch"}
        </Button>
      )}
      <Row label="Pull request">
        {pr ? (
          <span className="inline-flex items-center gap-1.5">
            <GitPullRequest className="size-3" />
            <a href={pr.url} target="_blank" rel="noreferrer" className={LINK}>
              {`PR #${pr.number}`}
            </a>
            <Badge variant="outline" className="text-xs">
              {getPrStatusLabel(pr.state)}
            </Badge>
          </span>
        ) : (
          "No pull request linked"
        )}
      </Row>
    </div>
  );
}

export function TaskGithubDevelopmentPanel(
  props: TaskGithubDevelopmentPanelProps,
) {
  const { info, isLoading, onRefresh } = props;
  return (
    <Card className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Development</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label="Refresh development info"
          disabled={isLoading}
          onClick={onRefresh}
        >
          <RefreshCw className={isLoading ? "size-3 animate-spin" : "size-3"} />
        </Button>
      </div>
      {info ? (
        <PanelBody {...props} info={info} />
      ) : (
        <p className="text-xs text-muted-foreground">
          {isLoading
            ? "Loading development info…"
            : "Development info unavailable"}
        </p>
      )}
    </Card>
  );
}
