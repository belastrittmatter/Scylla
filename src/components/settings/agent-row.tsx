"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ALL_MCP_CAPABILITIES } from "@/constants/agent-capabilities";
import { AgentScopeToggles } from "./agent-scope-toggles";

export interface ConnectedMcpClientItem {
  id: string;
  clientId: string;
  name: string;
  icon?: string | null;
  uri?: string | null;
  scopes?: string[];
  createdAt?: Date | string | null;
}

export type AgentItem = ConnectedMcpClientItem;

function formatConnectedDate(date?: Date | string | null): string {
  if (!date) return "Recently";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return "Recently";
  }
}

export function AgentRow({
  agent,
  isRevoking,
  onRevoke,
  onScopesChange,
}: {
  agent: ConnectedMcpClientItem;
  isRevoking: boolean;
  onRevoke: () => void;
  onScopesChange?: (newScopes: string[]) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const connectedDate = formatConnectedDate(agent.createdAt);
  const activeCount = ALL_MCP_CAPABILITIES.filter((c) =>
    agent.scopes?.includes(c.id),
  ).length;

  return (
    <div className="flex flex-col rounded-lg border bg-card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background shadow-2xs overflow-hidden">
            {agent.icon && !imageError ? (
              <Image
                src={agent.icon}
                alt=""
                width={20}
                height={20}
                unoptimized
                onError={() => setImageError(true)}
                className="size-5 rounded object-contain"
              />
            ) : (
              <Sparkles className="size-4 shrink-0 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium leading-none text-foreground">
                {agent.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Connected {connectedDate} · Model Context Protocol
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <span>{activeCount} granted</span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </button>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isRevoking}
            onClick={onRevoke}
            className="h-8 text-xs cursor-pointer transition-colors"
          >
            {isRevoking && <Loader2 className="size-3.5 animate-spin" />}
            Revoke Access
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t bg-muted/10 p-4 animate-in fade-in-0 duration-150">
          <AgentScopeToggles
            clientId={agent.clientId}
            scopes={agent.scopes}
            onScopesChange={onScopesChange}
            disabled={isRevoking}
          />
        </div>
      )}
    </div>
  );
}
