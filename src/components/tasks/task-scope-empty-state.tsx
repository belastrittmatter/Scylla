"use client";

import * as React from "react";
import {
  CheckCircle2,
  CircleAlert,
  Inbox,
  Plus,
  SearchX,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export type TaskEmptyKind =
  "me" | "team" | "project" | "filtered" | "no_teams" | "load_error";

const COPY: Record<
  TaskEmptyKind,
  { icon: LucideIcon; title: string; body: string; action: string }
> = {
  me: {
    icon: CheckCircle2,
    title: "You're all caught up",
    body: "Nothing open is assigned to you. Enjoy it, or pick something from your team.",
    action: "New task",
  },
  team: {
    icon: Inbox,
    title: "No tasks in this team",
    body: "Tasks created in any of this team's projects show up here.",
    action: "New task",
  },
  project: {
    icon: Inbox,
    title: "No tasks in this project",
    body: "Create the first task to get this project moving.",
    action: "New task",
  },
  filtered: {
    icon: SearchX,
    title: "No tasks match these filters",
    body: "Try a different status, priority, or deadline.",
    action: "Clear filters",
  },
  no_teams: {
    icon: Users,
    title: "Create a team to start tracking tasks",
    body: "Teams organize your projects, tasks, and members in one place.",
    action: "New team",
  },
  load_error: {
    icon: CircleAlert,
    title: "Couldn't load your tasks",
    body: "Something went wrong on our side. Your teams and tasks are safe.",
    action: "Try again",
  },
};

interface TaskScopeEmptyStateProps {
  kind: TaskEmptyKind;
  /** Omitted hides the primary button (e.g. viewers cannot create). */
  onAction?: () => void;
  /** Optional secondary link, e.g. "Browse team tasks" from Me. */
  secondary?: { label: string; onClick: () => void };
}

export function TaskScopeEmptyState({
  kind,
  onAction,
  secondary,
}: TaskScopeEmptyStateProps) {
  const { icon: Icon, title, body, action } = COPY[kind];
  const isCreate = kind !== "filtered" && kind !== "load_error";
  return (
    <Empty>
      <EmptyHeader className="w-full max-w-sm">
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {/* pretty, not balance: balance split "Enjoy / it" across lines. */}
        <EmptyDescription className="text-pretty">{body}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        {onAction && (
          <Button
            onClick={onAction}
            variant={isCreate ? "default" : "outline"}
            className="gap-1.5"
          >
            {isCreate && <Plus className="size-4" />}
            {action}
          </Button>
        )}
        {secondary && (
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={secondary.onClick}
          >
            {secondary.label}
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}
