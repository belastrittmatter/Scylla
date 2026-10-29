"use client";

import * as React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  TaskFilters,
  TaskStatus,
  TaskPriority,
  DeadlineHorizon,
} from "./task-types";

interface TaskFilterToolbarProps {
  filters: TaskFilters;
  onFiltersChange: (next: TaskFilters) => void;
  onResetFilters: () => void;
}

export function TaskFilterToolbar({
  filters,
  onFiltersChange,
  onResetFilters,
}: TaskFilterToolbarProps) {
  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.deadlineHorizon !== "all";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/60 bg-white/40 px-6 py-2.5 dark:border-neutral-800/60 dark:bg-neutral-900/30">
      <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <InputGroup className="h-9 min-w-[220px] max-w-[280px] flex-1 rounded-lg border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
          <InputGroupAddon align="inline-start">
            <Search className="size-4 text-neutral-400" />
          </InputGroupAddon>
          <InputGroupInput
            value={filters.searchQuery}
            onChange={(e) =>
              onFiltersChange({ ...filters, searchQuery: e.target.value })
            }
            placeholder="Search tasks..."
            className="text-sm"
          />
        </InputGroup>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(val) =>
            onFiltersChange({ ...filters, status: val as TaskStatus | "all" })
          }
        >
          <SelectTrigger className="h-9 min-w-[130px] rounded-lg border-neutral-200/80 bg-white text-sm shadow-none dark:border-neutral-800 dark:bg-neutral-900">
            <SelectValue placeholder="Status">
              {filters.status === "all"
                ? "All Statuses"
                : filters.status === "todo"
                  ? "To Do"
                  : filters.status === "in_progress"
                    ? "In Progress"
                    : filters.status === "in_review"
                      ? "In Review"
                      : filters.status === "done"
                        ? "Done"
                        : filters.status}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">
              All Statuses
            </SelectItem>
            <SelectItem value="todo" className="text-sm">
              To Do
            </SelectItem>
            <SelectItem value="in_progress" className="text-sm">
              In Progress
            </SelectItem>
            <SelectItem value="in_review" className="text-sm">
              In Review
            </SelectItem>
            <SelectItem value="done" className="text-sm">
              Done
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priority}
          onValueChange={(val) =>
            onFiltersChange({
              ...filters,
              priority: val as TaskPriority | "all",
            })
          }
        >
          <SelectTrigger className="h-9 min-w-[125px] rounded-lg border-neutral-200/80 bg-white text-sm shadow-none dark:border-neutral-800 dark:bg-neutral-900">
            <SelectValue placeholder="Priority">
              {filters.priority === "all"
                ? "All Priorities"
                : filters.priority === "urgent"
                  ? "Urgent"
                  : filters.priority === "high"
                    ? "High"
                    : filters.priority === "medium"
                      ? "Medium"
                      : "Low"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">
              All Priorities
            </SelectItem>
            <SelectItem
              value="urgent"
              className="text-sm font-medium text-rose-600 dark:text-rose-400"
            >
              Urgent
            </SelectItem>
            <SelectItem
              value="high"
              className="text-sm font-medium text-amber-600 dark:text-amber-400"
            >
              High
            </SelectItem>
            <SelectItem value="medium" className="text-sm">
              Medium
            </SelectItem>
            <SelectItem value="low" className="text-sm text-neutral-500">
              Low
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Deadline Filter */}
        <Select
          value={filters.deadlineHorizon}
          onValueChange={(val) =>
            onFiltersChange({
              ...filters,
              deadlineHorizon: val as DeadlineHorizon,
            })
          }
        >
          <SelectTrigger className="h-9 min-w-[135px] rounded-lg border-neutral-200/80 bg-white text-sm shadow-none dark:border-neutral-800 dark:bg-neutral-900">
            <SelectValue placeholder="Deadline">
              {filters.deadlineHorizon === "all"
                ? "All Deadlines"
                : filters.deadlineHorizon === "overdue"
                  ? "Overdue"
                  : filters.deadlineHorizon === "today"
                    ? "Due Today"
                    : filters.deadlineHorizon === "upcoming"
                      ? "Upcoming"
                      : "No Due Date"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">
              All Deadlines
            </SelectItem>
            <SelectItem
              value="overdue"
              className="text-sm text-rose-600 dark:text-rose-400"
            >
              Overdue
            </SelectItem>
            <SelectItem
              value="today"
              className="text-sm text-amber-600 dark:text-amber-400"
            >
              Due Today
            </SelectItem>
            <SelectItem value="upcoming" className="text-sm">
              Upcoming
            </SelectItem>
            <SelectItem value="no_date" className="text-sm text-neutral-400">
              No Due Date
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 px-3 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <X className="mr-1.5 size-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <span className="text-primary hidden items-center gap-1.5 text-xs font-medium md:inline-flex">
          <SlidersHorizontal className="size-3.5" />
          Filtered
        </span>
      )}
    </div>
  );
}
