"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { McpCapabilityDefinition } from "@/constants/agent-capabilities";
import { cn } from "cn";

export interface ConsentScopeItemProps {
  capability: McpCapabilityDefinition;
  isChecked: boolean;
  onToggle: (scopeId: string, checked: boolean) => void;
}

export function ConsentScopeItem({
  capability,
  isChecked,
  onToggle,
}: ConsentScopeItemProps) {
  return (
    <div
      role="checkbox"
      aria-checked={isChecked}
      tabIndex={0}
      onClick={() => onToggle(capability.id, !isChecked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(capability.id, !isChecked);
        }
      }}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border p-2.5 transition-colors cursor-pointer select-none",
        isChecked
          ? capability.isDestructive
            ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
            : "border-border bg-card hover:bg-muted/30"
          : "border-border/60 bg-muted/10 opacity-70 hover:opacity-100",
      )}
    >
      <div className="space-y-0.5 min-w-0 pr-2">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground text-xs">
            {capability.label}
          </span>
          {capability.isDestructive && (
            <Badge
              variant="outline"
              className="gap-0.5 border-red-500/30 bg-red-500/10 text-[9px] font-semibold text-red-600 dark:text-red-400 px-1 py-0 h-4"
            >
              <AlertTriangle className="size-2.5" />
              Destructive
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-[11px] leading-tight">
          {capability.description}
        </p>
      </div>

      <Switch
        checked={isChecked}
        tabIndex={-1}
        className="pointer-events-none shrink-0"
      />
    </div>
  );
}
