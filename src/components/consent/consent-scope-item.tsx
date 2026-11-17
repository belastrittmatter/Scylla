"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { McpCapabilityDefinition } from "@/constants/agent-capabilities";

export interface ConsentScopeItemProps {
  capability: McpCapabilityDefinition;
  isChecked: boolean;
  onToggle: (scopeId: string, checked: boolean) => void;
}

/** One scope row: the whole row is the switch's label, so a click anywhere toggles it. */
export function ConsentScopeItem({
  capability,
  isChecked,
  onToggle,
}: ConsentScopeItemProps) {
  const id = React.useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const destructiveId = `${id}-destructive`;

  return (
    <li>
      <label className="has-[:focus-visible]:bg-ink/[0.03] hover:bg-ink/[0.03] flex cursor-pointer items-start gap-4 px-5 py-3 transition-colors select-none sm:px-6">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span id={labelId} className="text-ink text-sm font-medium">
              {capability.label}
            </span>
            {capability.isDestructive && (
              <span
                id={destructiveId}
                className="font-code text-destructive inline-flex items-center gap-1 text-xs tracking-[0.12em] uppercase"
              >
                <AlertTriangle className="size-3" aria-hidden="true" />
                Destructive
              </span>
            )}
          </span>
          <span
            id={descriptionId}
            className="text-ink-2 mt-0.5 block text-sm leading-snug"
          >
            {capability.description}
          </span>
          <code className="font-code text-ink-2 mt-1 block text-xs">
            {capability.id}
          </code>
        </span>

        <Switch
          checked={isChecked}
          onCheckedChange={(checked) => onToggle(capability.id, checked)}
          aria-labelledby={labelId}
          aria-describedby={
            capability.isDestructive
              ? `${destructiveId} ${descriptionId}`
              : descriptionId
          }
          className="data-unchecked:bg-ink-3 dark:data-unchecked:bg-ink-3 mt-0.5"
        />
      </label>
    </li>
  );
}
