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
          className="text-sm"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText className="text-xs">mins</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
        <span>Presets:</span>
        {[30, 60, 120, 240].map((mins) => (
          <Button
            key={mins}
            type="button"
            variant={estimatedMinutes === mins ? "default" : "outline"}
            size="xs"
            onClick={() => onEstimatedMinutesChange(mins)}
            className="h-5 px-1.5 text-xs font-medium"
          >
            {mins < 60 ? `${mins}m` : `${mins / 60}h`}
          </Button>
        ))}
      </div>
    </Field>
  );
}
