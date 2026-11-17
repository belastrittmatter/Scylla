"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { EYEBROW } from "./task-layout";

export type TaskEmptyKind =
  "me" | "team" | "project" | "filtered" | "no_teams" | "load_error";

const COPY: Record<
  TaskEmptyKind,
  { eyebrow: string; title: string; body: string; action: string }
> = {
  me: {
    eyebrow: "Assigned to you",
    title: "You're all caught up",
    body: "Nothing open is assigned to you. Enjoy it, or pick something from your team.",
    action: "New task",
  },
  team: {
    eyebrow: "Team tasks",
    title: "No tasks in this team",
    body: "Tasks created in any of this team's projects show up here.",
    action: "New task",
  },
  project: {
    eyebrow: "Project tasks",
    title: "No tasks in this project",
    body: "Create the first task to get this project moving.",
    action: "New task",
  },
  filtered: {
    eyebrow: "Filtered",
    title: "No tasks match these filters",
    body: "Try a different status, priority, or deadline.",
    action: "Clear filters",
  },
  no_teams: {
    eyebrow: "No teams yet",
    title: "Create a team to start tracking tasks",
    body: "Teams organize your projects, tasks, and members in one place.",
    action: "New team",
  },
  load_error: {
    eyebrow: "Load error",
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

/**
 * Left-aligned block at work-page density: mono eyebrow with the accent dot,
 * title, body, then actions on the same reading edge. The header already holds
 * the primary New task, so in-scope create actions stay outline here; only the
 * header-less no_teams state keeps a filled button.
 */
export function TaskScopeEmptyState({
  kind,
  onAction,
  secondary,
}: TaskScopeEmptyStateProps) {
  const { eyebrow, title, body, action } = COPY[kind];
  const isCreate = kind !== "filtered" && kind !== "load_error";
  return (
    <Empty className="justify-start gap-5 pt-16 md:pt-24">
      <EmptyHeader className="w-full max-w-md items-start gap-1.5 text-left">
        <p className={cn(EYEBROW, "mb-1 flex items-center gap-2")}>
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          {eyebrow}
        </p>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        {/* pretty, not balance: balance split "Enjoy / it" across lines. */}
        <EmptyDescription className="text-pretty">{body}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-md flex-row flex-wrap items-center justify-start gap-2">
        {onAction && (
          <Button
            onClick={onAction}
            variant={kind === "no_teams" ? "default" : "outline"}
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
