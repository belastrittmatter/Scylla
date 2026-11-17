"use client";

import * as React from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { TaskDatePicker } from "./task-date-picker";
import { getTaskDateRangeError } from "./task-utils";

interface TaskDrawerDateFieldsProps {
  startDateStr: string;
  dueDateStr: string;
  onStartDateChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
}

/** Start date + due date pickers, with an inline error when start is after due. */
export function TaskDrawerDateFields({
  startDateStr,
  dueDateStr,
  onStartDateChange,
  onDueDateChange,
}: TaskDrawerDateFieldsProps) {
  const rangeError = getTaskDateRangeError(startDateStr, dueDateStr);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Start date</FieldLabel>
          <TaskDatePicker
            value={startDateStr}
            onChange={onStartDateChange}
            placeholder="Pick start date"
          />
        </Field>

        <Field>
          <FieldLabel>Deadline Due Date</FieldLabel>
          <TaskDatePicker value={dueDateStr} onChange={onDueDateChange} />
        </Field>
      </div>
      {rangeError && (
        <p role="alert" className="text-destructive text-xs">
          {rangeError}
        </p>
      )}
    </div>
  );
}
