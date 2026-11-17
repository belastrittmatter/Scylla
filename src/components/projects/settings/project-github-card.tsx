import { ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>GitHub Integration</CardTitle>
        {!githubRepo && (
          <CardDescription>
            A repository can be linked when the project is created.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {githubRepo ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm">{githubRepo}</span>
              <Badge variant="secondary">Linked</Badge>
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
                <ExternalLink />
                Open in GitHub
              </Button>
              {canSync && (
                <Button
                  size="sm"
                  type="button"
                  onClick={onSync}
                  disabled={isSyncing}
                >
                  <RefreshCw />
                  {isSyncing ? "Syncing…" : "Sync now"}
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              The repository link is read-only and cannot be changed after the
              project is created.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            No GitHub repository linked
          </p>
        )}
      </CardContent>
    </Card>
  );
}
