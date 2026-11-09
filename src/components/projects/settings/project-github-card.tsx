"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, ExternalLink, Lock } from "lucide-react";

interface ProjectGithubCardProps {
  githubRepo: string | null;
  isSyncing: boolean;
  onSync: () => Promise<void>;
}

export function ProjectGithubCard({
  githubRepo,
  isSyncing,
  onSync,
}: ProjectGithubCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <svg className="size-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
            </svg>
            <span>GitHub Integration</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Synchronize tasks with GitHub Issues, automatic branches, and PR
            workflows.
          </CardDescription>
        </div>

        {githubRepo && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw
              className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`}
            />
            <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {githubRepo ? (
          <>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
                  <svg className="size-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {githubRepo}
                    </span>
                    <Badge
                      variant="secondary"
                      className="h-5 gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    >
                      <Check className="size-3" />
                      <span>Linked</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All tasks in this project synchronize bi-directionally with
                    GitHub Issues.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                render={
                  <a
                    href={`https://github.com/${githubRepo}`}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <span>Open in GitHub</span>
                <ExternalLink className="size-3" />
              </Button>
            </div>

            <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <Lock className="size-3.5 shrink-0" />
              <span>
                Repository association is view-only and permanent to prevent
                orphaned git branches, pull requests, and broken issue mappings.
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
            <svg
              className="size-8 text-muted-foreground/50 mb-2 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
            </svg>
            <p className="text-xs font-medium text-foreground">
              No GitHub repository linked
            </p>
            <p className="text-[11px] text-muted-foreground max-w-sm mt-0.5">
              This project operates in standalone mode without a GitHub
              repository link. GitHub links can only be configured during
              project creation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
