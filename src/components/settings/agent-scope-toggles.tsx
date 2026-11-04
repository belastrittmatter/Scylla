"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "cn";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ALL_MCP_CAPABILITIES } from "@/constants/agent-capabilities";

interface AgentScopeTogglesProps {
  clientId: string;
  scopes?: string[];
  onScopesChange?: (newScopes: string[]) => void;
  disabled?: boolean;
}

export function AgentScopeToggles({
  clientId,
  scopes = [],
  onScopesChange,
  disabled = false,
}: AgentScopeTogglesProps) {
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [isBatchUpdating, setIsBatchUpdating] = React.useState(false);

  const applyScopes = async (nextScopes: string[]) => {
    const prevScopes = [...scopes];
    onScopesChange?.(nextScopes);

    try {
      const res = await fetch("/api/agents/scopes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clientId, scopes: nextScopes }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update permissions");
      }
      toast.success("Updated agent permissions");
    } catch (err) {
      onScopesChange?.(prevScopes);
      toast.error(
        err instanceof Error ? err.message : "Failed to update permissions",
      );
    }
  };

  const handleToggle = async (scopeId: string, checked: boolean) => {
    const nextScopes = checked
      ? Array.from(new Set([...scopes, scopeId]))
      : scopes.filter((s) => s !== scopeId);

    setUpdatingId(scopeId);
    try {
      await applyScopes(nextScopes);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSelectPreset = async (
    targetScopes: readonly string[] | string[],
  ) => {
    setIsBatchUpdating(true);
    try {
      await applyScopes([...targetScopes]);
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const isBusy = disabled || isBatchUpdating;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 text-xs">
        <span className="text-muted-foreground font-medium text-[11px]">
          Quick Presets:
        </span>
        <div className="flex items-center gap-1.5">
          {isBatchUpdating && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground mr-1" />
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy || updatingId !== null}
            className="h-6 px-2 text-[11px] cursor-pointer"
            onClick={() =>
              handleSelectPreset(ALL_MCP_CAPABILITIES.map((c) => c.id))
            }
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy || updatingId !== null}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
            onClick={() => handleSelectPreset([])}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {ALL_MCP_CAPABILITIES.map((cap) => {
          const isChecked = scopes.includes(cap.id);
          const isThisUpdating = updatingId === cap.id;
          const isDisabled = isBusy || updatingId !== null;

          return (
            <div
              key={cap.id}
              role="checkbox"
              aria-checked={isChecked}
              tabIndex={0}
              onClick={() => {
                if (!isDisabled) {
                  handleToggle(cap.id, !isChecked);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!isDisabled) {
                    handleToggle(cap.id, !isChecked);
                  }
                }
              }}
              className={cn(
                "flex items-center justify-between gap-4 rounded-lg border p-3.5 cursor-pointer select-none transition-colors",
                isChecked
                  ? cap.isDestructive
                    ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
                    : "border-border bg-card hover:bg-muted/40"
                  : "border-border/60 bg-muted/10 opacity-75 hover:opacity-100",
                isDisabled &&
                  "opacity-50 cursor-not-allowed pointer-events-none",
              )}
            >
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    {cap.label}
                  </span>
                  {cap.isDestructive && (
                    <Badge
                      variant="outline"
                      className="gap-0.5 border-red-500/30 bg-red-500/10 text-[9px] font-semibold text-red-600 dark:text-red-400 px-1 py-0 h-4"
                    >
                      <AlertTriangle className="size-2.5" />
                      Destructive
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {cap.description}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isThisUpdating && (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                )}
                <Switch
                  checked={isChecked}
                  disabled={isDisabled}
                  tabIndex={-1}
                  className="pointer-events-none"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
