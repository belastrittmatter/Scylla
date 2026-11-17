"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { MONO_META } from "./task-layout";

interface TaskDrawerEstimateFieldProps {
  estimatedMinutes: number;
  onEstimatedMinutesChange: (v: number) => void;
}

/** Estimated time in minutes, with quick presets. */
export function TaskDrawerEstimateField({
  estimatedMinutes,
  onEstimatedMinutesChange,
}: TaskDrawerEstimateFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor="task-estimate">Estimated Time</FieldLabel>
      <InputGroup className="h-9">
        <InputGroupInput
          id="task-estimate"
          type="number"
          min={0}
          step={15}
          value={estimatedMinutes || ""}
          onChange={(e) =>
            onEstimatedMinutesChange(
              Math.max(0, parseInt(e.target.value, 10) || 0),
            )
          }
          placeholder="e.g. 60"
          className="font-code tabular-nums"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText className={MONO_META}>mins</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
        <span id="task-estimate-presets">Presets:</span>
        {/* Selected preset is a quiet active segment; ember stays on Save. */}
        {[30, 60, 120, 240].map((mins) => {
          const active = estimatedMinutes === mins;
          return (
            <Button
              key={mins}
              type="button"
              variant="outline"
              size="xs"
              aria-pressed={active}
              aria-describedby="task-estimate-presets"
              onClick={() => onEstimatedMinutesChange(mins)}
              className={cn(
                MONO_META,
                "text-muted-foreground",
                active &&
                  "bg-muted text-foreground hover:bg-muted dark:bg-muted",
              )}
            >
              {mins < 60 ? `${mins}m` : `${mins / 60}h`}
            </Button>
          );
        })}
      </div>
    </Field>
  );
}
