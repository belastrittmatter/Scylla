"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDatePicker } from "./task-date-picker";
import { AssigneeSearchPicker } from "./assignee-search-picker";
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
    dueDateStr,
    estimatedMinutes,
    users,
    onTitleChange,
    onDescriptionChange,
    onStatusChange,
    onPriorityChange,
    onAssigneeChange,
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
          className="h-9 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select
            value={status}
            onValueChange={(val) => val && onStatusChange(val as TaskStatus)}
          >
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${curStatus?.dot || "bg-neutral-400"}`}
                  />
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
                    <span className={`size-2 rounded-full ${item.dot}`} />
                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Priority</FieldLabel>
          <Select
            value={priority}
            onValueChange={(val) =>
              val && onPriorityChange(val as TaskPriority)
            }
          >
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue>
                <span className={curPriority?.color || ""}>
                  {curPriority?.label || priority}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TASK_FORM_PRIORITIES.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="text-sm"
                >
                  <span className={item.color}>{item.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field>
        <FieldLabel>Assignee</FieldLabel>
        <AssigneeSearchPicker
          users={users}
          assigneeId={assigneeId}
          onAssigneeChange={onAssigneeChange}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Deadline Due Date</FieldLabel>
          <TaskDatePicker value={dueDateStr} onChange={onDueDateChange} />
        </Field>

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
          <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-[11px]">
            <span>Presets:</span>
            {[30, 60, 120, 240].map((mins) => (
              <Button
                key={mins}
                type="button"
                variant={estimatedMinutes === mins ? "default" : "outline"}
                size="xs"
                onClick={() => onEstimatedMinutesChange(mins)}
                className="h-5 px-1.5 text-[10px] font-medium"
              >
                {mins < 60 ? `${mins}m` : `${mins / 60}h`}
              </Button>
            ))}
          </div>
        </Field>
      </div>

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
          className="resize-none text-sm"
        />
      </Field>
    </FieldGroup>
  );
}
