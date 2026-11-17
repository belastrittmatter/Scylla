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
  const baseId = React.useId();

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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <span className="text-xs font-medium text-muted-foreground">
          Quick presets
        </span>
        <div className="flex items-center gap-1">
          {isBatchUpdating && (
            <Loader2
              className="mr-1 size-3.5 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy || updatingId !== null}
            className="h-7 px-2 text-xs"
            onClick={() =>
              handleSelectPreset(ALL_MCP_CAPABILITIES.map((c) => c.id))
            }
          >
            Grant All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy || updatingId !== null}
            className="h-7 px-2 text-xs"
            onClick={() =>
              handleSelectPreset(
                ALL_MCP_CAPABILITIES.filter((c) => !c.isDestructive).map(
                  (c) => c.id,
                ),
              )
            }
          >
            Standard Only
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy || updatingId !== null}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => handleSelectPreset([])}
          >
            Clear
          </Button>
        </div>
      </div>

      <ul className="grid gap-x-6 sm:grid-cols-2">
        {ALL_MCP_CAPABILITIES.map((cap) => {
          const isChecked = scopes.includes(cap.id);
          const isThisUpdating = updatingId === cap.id;
          const isDisabled = isBusy || updatingId !== null;
          const switchId = `${baseId}-${cap.id}`;
          const labelId = `${switchId}-label`;
          const descriptionId = `${switchId}-description`;

          return (
            <li key={cap.id}>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <label
                  htmlFor={switchId}
                  className={cn(
                    "min-w-0 flex-1 space-y-0.5 select-none",
                    isDisabled
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer",
                  )}
                >
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span
                      id={labelId}
                      className="text-sm font-medium text-foreground"
                    >
                      {cap.label}
                    </span>
                    {cap.isDestructive && (
                      <Badge
                        variant="outline"
                        className="h-4 gap-1 border-destructive/40 bg-transparent px-1 py-0 text-[11px] font-medium text-destructive"
                      >
                        <AlertTriangle className="size-3" aria-hidden="true" />
                        Destructive
                      </Badge>
                    )}
                  </span>
                  <span
                    id={descriptionId}
                    className="block text-xs leading-snug text-pretty text-muted-foreground"
                  >
                    {cap.description}
                  </span>
                </label>
                <span className="flex shrink-0 items-center gap-2 pt-0.5">
                  {isThisUpdating && (
                    <Loader2
                      className="size-3.5 animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  <Switch
                    id={switchId}
                    checked={isChecked}
                    disabled={isDisabled}
                    aria-disabled={isDisabled || undefined}
                    aria-labelledby={labelId}
                    aria-describedby={descriptionId}
                    onCheckedChange={(checked) => {
                      if (!isDisabled) {
                        void handleToggle(cap.id, checked);
                      }
                    }}
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
