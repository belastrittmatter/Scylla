"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDrawerDateFields } from "./task-drawer-date-fields";
import { TaskDrawerEstimateField } from "./task-drawer-estimate-field";
import { AssigneeCombobox } from "./assignee-combobox";
import { StatusIcon } from "./task-status-icon";
import { getQuietPriority } from "./task-utils";
import {
  TASK_FORM_STATUSES,
  TASK_FORM_PRIORITIES,
  type TaskPriority,
  type TaskStatus,
  type TaskDrawerFormProps,
} from "./task-types";

export function TaskDrawerForm(props: TaskDrawerFormProps) {
  const {
    title,
    description,
    status,
    priority,
    assigneeId,
    startDateStr,
    dueDateStr,
    estimatedMinutes,
    users,
    onTitleChange,
    onDescriptionChange,
    onStatusChange,
    onPriorityChange,
    onAssigneeChange,
    onStartDateChange,
    onDueDateChange,
    onEstimatedMinutesChange,
  } = props;
  const curStatus = TASK_FORM_STATUSES.find((s) => s.value === status);
  const curPriority = TASK_FORM_PRIORITIES.find((p) => p.value === priority);

  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel htmlFor="task-title">Task Title</FieldLabel>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Task summary..."
          className="h-9"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="task-status">Status</FieldLabel>
          <Select
            value={status}
            onValueChange={(val) => val && onStatusChange(val as TaskStatus)}
          >
            <SelectTrigger id="task-status" className="h-9 w-full text-sm">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <StatusIcon status={status} />
                  <span>{curStatus?.label || status}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TASK_FORM_STATUSES.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="text-sm"
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon status={item.value} />
                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="task-priority">Priority</FieldLabel>
          <Select
            value={priority}
            onValueChange={(val) =>
              val && onPriorityChange(val as TaskPriority)
            }
          >
            <SelectTrigger id="task-priority" className="h-9 w-full text-sm">
              <SelectValue>
                <PriorityLabel
                  value={priority}
                  label={curPriority?.label || priority}
                />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TASK_FORM_PRIORITIES.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="text-sm"
                >
                  <PriorityLabel value={item.value} label={item.label} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="task-assignee">Assignee</FieldLabel>
          <AssigneeCombobox
            id="task-assignee"
            users={users}
            assigneeId={assigneeId}
            onAssigneeChange={onAssigneeChange}
          />
        </Field>

        <TaskDrawerEstimateField
          estimatedMinutes={estimatedMinutes}
          onEstimatedMinutesChange={onEstimatedMinutesChange}
        />
      </div>

      <TaskDrawerDateFields
        startDateStr={startDateStr}
        dueDateStr={dueDateStr}
        onStartDateChange={onStartDateChange}
        onDueDateChange={onDueDateChange}
      />

      <Field>
        <FieldLabel htmlFor="task-description">
          Description / Acceptance Criteria
        </FieldLabel>
        <Textarea
          id="task-description"
          rows={4}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Provide context, acceptance criteria or links..."
          className="resize-none"
        />
      </Field>
    </FieldGroup>
  );
}

/** Same quiet chip as the board and list for urgent/high; plain text otherwise. */
function PriorityLabel({ value, label }: { value: string; label: string }) {
  const quiet = getQuietPriority(value, false);
  return <span className={quiet?.className}>{label}</span>;
}
