"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  projectId: string;
  githubRepo: string | null;
  canSync: boolean;
};

type SyncResponse = {
  error?: string;
  data?: { createdCount: number; updatedCount: number };
};

export function ProjectGithubCard({ projectId, githubRepo, canSync }: Props) {
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/github-sync`, {
        method: "POST",
      });
      // An HTML error page from a proxy is not JSON; fall back to the status.
      const json: SyncResponse | null = await res.json().catch(() => null);
      if (!res.ok || !json?.data) {
        throw new Error(json?.error || `Sync failed (HTTP ${res.status})`);
      }
      const { createdCount, updatedCount } = json.data;
      toast.success(`Synced: ${createdCount} new, ${updatedCount} updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>GitHub Repository</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {githubRepo ? (
          <div className="flex flex-wrap items-center gap-3">
            <code className="bg-muted rounded px-2 py-1 text-sm">
              {githubRepo}
            </code>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                render={
                  <a
                    href={`https://github.com/${githubRepo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <ExternalLink />
                Open on GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </Button>
              {canSync && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sync}
                  disabled={syncing}
                  aria-busy={syncing}
                >
                  <RefreshCw
                    className={syncing ? "motion-safe:animate-spin" : undefined}
                  />
                  {syncing ? "Syncing issues…" : "Sync issues"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            This project is not linked to a GitHub repository.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
