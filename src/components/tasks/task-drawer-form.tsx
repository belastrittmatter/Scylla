"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
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
    startDateStr,
    dueDateStr,
    estimatedMinutes,
    users,
    isProjectLinkedToGithub,
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
                    className={`size-2 rounded-full ${curStatus?.dot || "bg-muted-foreground"}`}
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

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Assignee</FieldLabel>
          <AssigneeSearchPicker
            users={users}
            isProjectLinkedToGithub={isProjectLinkedToGithub}
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
        <MarkdownEditor
          id="task-description"
          rows={4}
          value={description}
          onChange={onDescriptionChange}
          placeholder="Provide context, acceptance criteria or links..."
        />
      </Field>
    </FieldGroup>
  );
}
