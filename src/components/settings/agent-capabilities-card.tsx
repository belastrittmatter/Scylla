"use client";

import * as React from "react";
import { Check, Copy, Ghost } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
    <Card className="w-full gap-6 pt-6 pb-0 text-start shadow-xs">
      <CardHeader className="gap-1.5 px-6">
        <CardTitle className="text-lg font-semibold md:text-xl">
          AI Agent & MCP Capabilities
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground md:text-sm">
          Audit and revoke active capabilities granted to autonomous AI agents
          and MCP integrations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        {/* MCP Server URL Copy Input */}
        <div className="space-y-2">
          <Label
            htmlFor="mcp-server-url"
            className="text-xs font-medium text-muted-foreground"
          >
            MCP Server URL
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="mcp-server-url"
              readOnly
              value={mcpUrl}
              className="font-mono text-xs select-all"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="shrink-0 gap-1.5 text-xs"
            >
              {copied ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste this URL into your MCP client (Cursor, Claude Desktop, Codex)
            to connect.
          </p>
        </div>

        <Separator />

        {/* Authorized AI Agents List */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground">
            Authorized Agents
          </Label>

          {isLoading ? (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center text-muted-foreground">
              <Ghost className="mb-2 size-8 opacity-40" />
              <p className="text-sm font-medium">No Active AI Agents</p>
              <p className="text-xs text-muted-foreground">
                No active AI agents or MCP integrations are currently
                authorized.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => (
                <AgentRow
                  key={client.clientId}
                  agent={client}
                  isRevoking={revokingId === client.clientId}
                  onRevoke={() => handleRevoke(client.clientId)}
                  onScopesChange={(newScopes) =>
                    handleScopesChange(client.clientId, newScopes)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
        <span>
          Authorized AI agents and MCP servers access your calendar, tasks, and
          teams under strict capability boundaries.
        </span>
      </CardFooter>
    </Card>
  );
}
