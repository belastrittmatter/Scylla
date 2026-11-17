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

export function ProjectGithubCard({ projectId, githubRepo, canSync }: Props) {
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/github-sync`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
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
        <CardTitle>GitHub Repository</CardTitle>
      </CardHeader>
      <CardContent>
        {githubRepo ? (
          <div className="flex flex-wrap items-center gap-3">
            <code className="bg-muted rounded px-2 py-1 text-sm">
              {githubRepo}
            </code>
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
            </Button>
            {canSync && (
              <Button size="sm" onClick={sync} disabled={syncing}>
                <RefreshCw />
                {syncing ? "Syncing..." : "Sync now"}
              </Button>
            )}
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
