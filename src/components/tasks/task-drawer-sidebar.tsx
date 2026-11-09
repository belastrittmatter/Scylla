"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { TaskDatePicker } from "./task-date-picker";
import { AssigneeSearchPicker } from "./assignee-search-picker";
import { TaskGithubDevelopmentCard } from "./task-github-development-card";
import { validateTaskTransitionRule } from "@/services/task/task-rules";
import {
  TASK_FORM_STATUSES,
  TASK_FORM_PRIORITIES,
  type TaskItem,
  type TaskPriority,
  type TaskStatus,
  type TaskUser,
} from "./task-types";

export interface TaskDrawerSidebarProps {
  task: TaskItem;
  isDraft: boolean;
  users: TaskUser[];
  currentUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  currentTeamRole?: string | null;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDateStr: string;
  estimatedMinutes: number;
  isLinkedWithGithub: boolean;
  onAssigneeChange: (id: string) => void;
  onStatusChange: (status: TaskStatus) => void;
  onPriorityChange: (priority: TaskPriority) => void;
  onDueDateChange: (date: string) => void;
  onEstimatedMinutesChange: (mins: number) => void;
  onTaskUpdated: (updated: TaskItem) => void;
}

export function TaskDrawerSidebar({
  task,
  isDraft,
  users,
  currentUser,
  currentTeamRole,
  assigneeId,
  status,
  priority,
  dueDateStr,
  estimatedMinutes,
  isLinkedWithGithub,
  onAssigneeChange,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onEstimatedMinutesChange,
  onTaskUpdated,
}: TaskDrawerSidebarProps) {
  const curStatus = TASK_FORM_STATUSES.find((s) => s.value === status);
  const curPriority = TASK_FORM_PRIORITIES.find((p) => p.value === priority);

  return (
    <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-3.5 pt-0.5 border-t lg:border-t-0 lg:border-l border-border/70 pt-4 lg:pt-0 lg:pl-6">
      {/* Assignees Section */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Assignees
        </Label>
        <AssigneeSearchPicker
          users={users}
          assigneeId={assigneeId}
          onAssigneeChange={onAssigneeChange}
          isProjectLinkedToGithub={Boolean(
            task?.project?.githubRepo || task?.githubIssueNumber,
          )}
        />
      </div>

      <Separator />

      {/* Status Section */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Status
        </Label>
        <Select
          value={status}
          onValueChange={(val) => val && onStatusChange(val as TaskStatus)}
        >
          <SelectTrigger className="h-9 w-full text-xs">
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
            {TASK_FORM_STATUSES.map((item) => {
              const ruleCheck =
                isDraft || item.value === task.status
                  ? { allowed: true }
                  : validateTaskTransitionRule({
                      task,
                      targetStatus: item.value,
                      currentUser,
                      currentTeamRole,
                      isProjectLinkedToGithub: isLinkedWithGithub,
                    });

              return (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  disabled={!ruleCheck.allowed}
                  className="text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${item.dot}`} />
                    <span>{item.label}</span>
                    {!ruleCheck.allowed && (
                      <span className="text-[10px] text-muted-foreground italic ml-1">
                        (restricted)
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Priority Section */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Priority
        </Label>
        <Select
          value={priority}
          onValueChange={(val) => val && onPriorityChange(val as TaskPriority)}
        >
          <SelectTrigger className="h-9 w-full text-xs">
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
                className="text-xs"
              >
                <span className={item.color}>{item.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Due Date Section */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Due Date
        </Label>
        <TaskDatePicker value={dueDateStr} onChange={onDueDateChange} />
      </div>

      <Separator />

      {/* Estimated Time Section */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Estimate
        </Label>
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
            className="text-xs"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText className="text-[11px]">hours</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          <span>Presets:</span>
          {[1, 2, 4, 8].map((hrs) => (
            <Button
              key={hrs}
              type="button"
              variant={estimatedMinutes === hrs * 60 ? "default" : "secondary"}
              size="xs"
              onClick={() => onEstimatedMinutesChange(hrs * 60)}
              className="h-5 px-2 text-[10px] font-medium"
            >
              {hrs}h
            </Button>
          ))}
        </div>
      </div>

      {/* Development Section (ONLY shown if project/task is linked with GitHub) */}
      {isLinkedWithGithub && !isDraft && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Development
            </Label>
            <TaskGithubDevelopmentCard
              task={task}
              onTaskUpdated={onTaskUpdated}
            />
          </div>
        </>
      )}
    </div>
  );
}
