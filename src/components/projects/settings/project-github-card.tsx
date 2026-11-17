import { ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
        {!githubRepo && (
          <p className="text-muted-foreground text-sm">
            A repository can be linked when the project is created.
          </p>
        )}
      </div>
      <Card>
        <CardContent className="space-y-3">
          {githubRepo ? (
            <>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-all font-mono text-sm">
                    {githubRepo}
                  </span>
                  <Badge variant="secondary">Linked</Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  The repository link is read-only and cannot be changed after
                  the project is created.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No GitHub repository linked
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
