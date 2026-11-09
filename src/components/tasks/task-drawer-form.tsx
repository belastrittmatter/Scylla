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
import { MarkdownEditor } from "@/components/ui/markdown-editor";
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
    isProjectLinkedToGithub,
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
          isProjectLinkedToGithub={isProjectLinkedToGithub}
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
              step={0.5}
              value={estimatedMinutes ? estimatedMinutes / 60 : ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onEstimatedMinutesChange(
                  isNaN(val) || val <= 0 ? 0 : Math.round(val * 60),
                );
              }}
              placeholder="e.g. 2"
              className="text-sm"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText className="text-xs">hours</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-[11px]">
            <span>Presets:</span>
            {[1, 2, 4, 8].map((hrs) => (
              <Button
                key={hrs}
                type="button"
                variant={estimatedMinutes === hrs * 60 ? "default" : "outline"}
                size="xs"
                onClick={() => onEstimatedMinutesChange(hrs * 60)}
                className="h-5 px-1.5 text-[10px] font-medium"
              >
                {hrs}h
              </Button>
            ))}
          </div>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="task-description">
          Description / Acceptance Criteria
        </FieldLabel>
        <MarkdownEditor
          id="task-description"
          value={description}
          onChange={onDescriptionChange}
          placeholder="Provide context, acceptance criteria or links (Markdown supported)..."
        />
      </Field>
    </FieldGroup>
  );
}
