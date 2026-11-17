"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/landing/primitives";
import {
  ALL_MCP_CAPABILITIES,
  type McpCapabilityDefinition,
} from "@/constants/agent-capabilities";
import { ConsentScopeItem } from "./consent-scope-item";

const CATEGORY_LABELS: Record<string, string> = {
  calendar: "Calendar",
  rooms: "Rooms & Workspaces",
  tasks: "Tasks & Work",
  projects: "Projects",
  teams: "Teams & Access",
};

const PRESET_BUTTON = "h-8 px-2.5 text-xs";

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
  const headingId = React.useId();

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
    <section aria-labelledby={headingId} className="border-line mt-6 border-t">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-baseline gap-3">
          <h2 id={headingId} className="text-ink text-sm font-medium">
            Permissions
          </h2>
          <span
            aria-live="polite"
            className="font-code text-ink-2 text-xs tabular-nums"
          >
            {enabledCount}/{ALL_MCP_CAPABILITIES.length} granted
          </span>
        </div>

        <div
          role="group"
          aria-label="Presets"
          className="flex flex-wrap items-center gap-1.5"
        >
          <Button
            type="button"
            variant="outline"
            className={PRESET_BUTTON}
            onClick={onSelectAll}
          >
            Grant All
          </Button>
          <Button
            type="button"
            variant="outline"
            className={PRESET_BUTTON}
            onClick={onSelectStandard}
          >
            Standard Only
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={PRESET_BUTTON}
            onClick={onClearAll}
          >
            Clear
          </Button>
        </div>
      </div>

      {Object.entries(capabilitiesByCategory).map(([categoryKey, items]) => {
        const label = CATEGORY_LABELS[categoryKey] || categoryKey;
        return (
          <div key={categoryKey} role="group" aria-label={label}>
            <Eyebrow className="text-ink-2 border-line border-t px-5 pt-4 pb-1 sm:px-6">
              {label}
            </Eyebrow>
            <ul className="divide-line divide-y">
              {items.map((cap) => (
                <ConsentScopeItem
                  key={cap.id}
                  capability={cap}
                  isChecked={selectedScopes.includes(cap.id)}
                  onToggle={onToggleScope}
                />
              ))}
            </ul>
          </div>
        );
      })}

      {hasDestructiveSelected && (
        <div
          role="status"
          className="border-line text-ink-2 flex items-start gap-2.5 border-t px-5 py-4 text-sm sm:px-6"
        >
          <ShieldAlert
            className="text-destructive mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <p>
            <span className="text-destructive font-semibold">
              Destructive Scopes Granted:
            </span>{" "}
            You have enabled permanent deletion capabilities for this client.
            The client will be able to delete resources within your permissions.
          </p>
        </div>
      )}
    </section>
  );
}
