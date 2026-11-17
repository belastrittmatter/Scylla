import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface ProjectGithubCardProps {
  githubRepo: string | null;
  canSync: boolean;
  isSyncing: boolean;
  onSync: () => void;
}

export function ProjectGithubCard({
  githubRepo,
  canSync,
  isSyncing,
  onSync,
}: ProjectGithubCardProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">GitHub Integration</h2>
        {githubRepo && (
          <p className="text-muted-foreground text-sm">
            The repository link is read-only and cannot be changed after the
            project is created.
          </p>
        )}
      </div>
      <Card>
        <CardContent>
          {githubRepo ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0 break-all font-mono text-sm">
                {githubRepo}
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={`https://github.com/${githubRepo}`}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  <ExternalLink aria-hidden="true" />
                  Open in GitHub
                  <span className="sr-only">(opens in a new tab)</span>
                </Button>
                {canSync && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={onSync}
                    disabled={isSyncing}
                  >
                    <RefreshCw aria-hidden="true" />
                    {isSyncing ? "Syncing…" : "Sync now"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No GitHub repository linked. A repository can only be linked when
              the project is created.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
