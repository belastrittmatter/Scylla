"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { copyToClipboard } from "@/lib/clipboard";
import { AgentRow, type ConnectedMcpClientItem } from "./agent-row";

const subscribe = () => () => {};
const getSnapshot = () =>
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";
const getServerSnapshot = () => "http://localhost:3000";

export function AgentCapabilitiesCard() {
  const [clients, setClients] = React.useState<ConnectedMcpClientItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const baseUrl = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const mcpUrl = `${baseUrl}/api/mcp`;

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(mcpUrl);
    if (success) {
      setCopied(true);
      toast.success("Copied MCP server URL");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy URL");
    }
  };

  const fetchClients = React.useCallback(async () => {
    try {
      const res = await fetch("/api/agents", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load agents");
      const data = await res.json();
      const list = Array.isArray(data?.clients)
        ? data.clients
        : Array.isArray(data?.agents)
          ? data.agents
          : [];
      setClients(list);
    } catch {
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    queueMicrotask(() => {
      void fetchClients();
    });
  }, [fetchClients]);

  const handleRevoke = async (clientId: string) => {
    setRevokingId(clientId);
    try {
      const res = await fetch("/api/agents/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clientId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to revoke client access");
      }
      toast.success("Agent access revoked successfully");
      await fetchClients();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke agent access",
      );
    } finally {
      setRevokingId(null);
    }
  };

  const handleScopesChange = (clientId: string, newScopes: string[]) => {
    setClients((prev) =>
      prev.map((c) =>
        c.clientId === clientId ? { ...c, scopes: newScopes } : c,
      ),
    );
  };

  return (
    <>
      <div className="space-y-2 px-4 py-3.5 sm:px-5">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            MCP server URL
          </p>
          <p className="text-xs text-pretty text-muted-foreground">
            Paste this URL into your MCP client (Cursor, Claude Desktop, Codex)
            to connect.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <code
            id="mcp-server-url"
            className="min-w-0 flex-1 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 font-code text-xs leading-4 break-all text-foreground select-all"
          >
            {mcpUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyUrl}
            className="shrink-0 gap-1.5 text-xs"
          >
            {copied ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <div>
        <p className="px-4 pt-3.5 pb-2 text-sm font-medium text-foreground sm:px-5">
          Authorized agents
          {!isLoading && clients.length > 0 ? (
            <span className="font-code text-xs font-normal text-muted-foreground">
              {" · "}
              {clients.length}
            </span>
          ) : null}
        </p>

        {isLoading ? (
          <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-7 w-24" />
          </div>
        ) : clients.length === 0 ? (
          <p className="px-4 pb-3.5 text-xs text-muted-foreground sm:px-5">
            No AI agents or MCP integrations are authorized yet. Connect a
            client with the URL above.
          </p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {clients.map((client) => (
              <li key={client.clientId}>
                <AgentRow
                  agent={client}
                  isRevoking={revokingId === client.clientId}
                  onRevoke={() => handleRevoke(client.clientId)}
                  onScopesChange={(newScopes) =>
                    handleScopesChange(client.clientId, newScopes)
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
