"use client";

import * as React from "react";
import {
  CalendarDays,
  Building2,
  ListTodo,
  FolderKanban,
  Users,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ALL_MCP_CAPABILITIES,
  type McpCapabilityDefinition,
} from "@/constants/agent-capabilities";
import { ConsentScopeItem } from "./consent-scope-item";
import { cn } from "cn";

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  calendar: { label: "Calendar", icon: CalendarDays },
  rooms: { label: "Rooms & Workspaces", icon: Building2 },
  tasks: { label: "Tasks & Work", icon: ListTodo },
  projects: { label: "Projects", icon: FolderKanban },
  teams: { label: "Teams & Access", icon: Users },
};

export interface ConsentScopeListProps {
  selectedScopes: string[];
  onToggleScope: (scopeId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onSelectStandard: () => void;
  onClearAll: () => void;
}

export function ConsentScopeList({
  selectedScopes,
  onToggleScope,
  onSelectAll,
  onSelectStandard,
  onClearAll,
}: ConsentScopeListProps) {
  const [isCustomizeExpanded, setIsCustomizeExpanded] = React.useState(true);

  const capabilitiesByCategory = React.useMemo(() => {
    const groups: Record<string, McpCapabilityDefinition[]> = {};
    for (const cap of ALL_MCP_CAPABILITIES) {
      const cat = cap.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(cap);
    }
    return groups;
  }, []);

  const enabledCount = selectedScopes.length;
  const hasDestructiveSelected = ALL_MCP_CAPABILITIES.some(
    (c) => c.isDestructive && selectedScopes.includes(c.id),
  );

  return (
    <div className="space-y-4">
      <div className="border-border rounded-xl border bg-background overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsCustomizeExpanded((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsCustomizeExpanded((prev) => !prev);
            }
          }}
          className="flex items-center justify-between p-3.5 cursor-pointer select-none bg-muted/10 hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-orange-600 dark:text-orange-400" />
            <span className="font-semibold text-foreground text-xs">
              Permissions & Capabilities
            </span>
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] font-medium px-2 py-0.5",
                enabledCount > 0
                  ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {enabledCount} of {ALL_MCP_CAPABILITIES.length} granted
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-[11px] font-medium">
              {isCustomizeExpanded ? "Collapse" : "Customize"}
            </span>
            {isCustomizeExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </div>
        </div>

        {isCustomizeExpanded && (
          <div className="border-border border-t px-3.5 py-2 bg-muted/5 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-muted-foreground font-medium">Presets:</span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={onSelectAll}
              >
                Grant All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={onSelectStandard}
              >
                Standard Only
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                onClick={onClearAll}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {isCustomizeExpanded && (
          <div className="border-border border-t p-3 space-y-4 max-h-[380px] overflow-y-auto">
            {Object.entries(capabilitiesByCategory).map(
              ([categoryKey, items]) => {
                const catMeta = CATEGORY_META[categoryKey] || {
                  label: categoryKey,
                  icon: SlidersHorizontal,
                };
                const Icon = catMeta.icon;

                return (
                  <div key={categoryKey} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider px-1">
                      <Icon className="size-3 text-orange-500" />
                      <span>{catMeta.label}</span>
                    </div>

                    <div className="space-y-1.5">
                      {items.map((cap) => (
                        <ConsentScopeItem
                          key={cap.id}
                          capability={cap}
                          isChecked={selectedScopes.includes(cap.id)}
                          onToggle={onToggleScope}
                        />
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>

      {hasDestructiveSelected && (
        <div className="border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl border p-3 text-[11px] flex items-start gap-2.5">
          <ShieldAlert className="size-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div>
            <span className="font-semibold">Destructive Scopes Granted:</span>{" "}
            You have enabled permanent deletion capabilities for this client.
            The client will be able to delete resources within your permissions.
          </div>
        </div>
      )}
    </div>
  );
}
