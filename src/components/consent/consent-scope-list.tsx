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

/** Row hairlines inset to the text edge, so only group breaks run full width. */
const ROW_DIVIDERS =
  "[&>li]:relative [&>li+li]:before:absolute [&>li+li]:before:top-0 [&>li+li]:before:right-0 [&>li+li]:before:left-5 sm:[&>li+li]:before:left-6 [&>li+li]:before:h-px [&>li+li]:before:bg-line";

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
      {/* Mobile: title, description, presets. Desktop: presets beside the title, description full width below. */}
      <div className="grid gap-y-1 px-5 py-4 sm:grid-cols-[1fr_auto] sm:gap-x-6 sm:px-6">
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
        <p className="text-ink-2 text-sm sm:col-span-2">
          Grant only the capabilities it needs.
        </p>

        <div
          role="group"
          aria-label="Presets"
          className="mt-2 flex flex-wrap items-center gap-1.5 sm:col-start-2 sm:row-start-1 sm:mt-0 sm:-my-1.5"
        >
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
            onClick={onSelectAll}
          >
            Grant All
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
          <div
            key={categoryKey}
            role="group"
            aria-label={label}
            className="border-line border-t pt-1 pb-2"
          >
            <Eyebrow dot={false} className="text-ink-2 px-5 pt-4 pb-1 sm:px-6">
              {label}
            </Eyebrow>
            <ul className={ROW_DIVIDERS}>
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
