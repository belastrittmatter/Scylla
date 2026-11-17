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
  const panelId = React.useId();
  const connectedDate = formatConnectedDate(agent.createdAt);
  const activeCount = ALL_MCP_CAPABILITIES.filter((c) =>
    agent.scopes?.includes(c.id),
  ).length;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
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
              <Sparkles
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-sm font-medium text-foreground">
              {agent.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Connected{" "}
              <span className="font-code">{connectedDate}</span> · Model
              Context Protocol
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-controls={isExpanded ? panelId : undefined}
            aria-label={`${activeCount} granted to ${agent.name}, ${isExpanded ? "hide" : "show"} permissions`}
            className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span>
              <span className="font-code">{activeCount}</span> granted
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </button>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isRevoking}
            onClick={onRevoke}
            aria-label={`Revoke Access for ${agent.name}`}
            className="text-xs"
          >
            {isRevoking && (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            )}
            Revoke Access
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div
          id={panelId}
          className="border-t border-border bg-muted/30 px-4 py-3.5 animate-in fade-in-0 duration-150 sm:px-5"
        >
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
