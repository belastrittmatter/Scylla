"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EYEBROW, MONO_META } from "./task-layout";
import { TaskBulkActionBar } from "./task-bulk-action-bar";
import { TaskTableRow } from "./task-table-row";
import { groupTasksForList } from "./task-selectors";
import type { TaskItem, TaskStatus } from "./task-types";

interface TaskTableViewProps {
  tasks: TaskItem[];
  /** Deadline buckets (Me/All) or workflow status (Team). */
  groupBy: "deadline" | "status";
  onSelectTask: (task: TaskItem) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  /** Muted "Team · Project" shown after the title; omit for none. */
  getContextLabel?: (task: TaskItem) => string | null;
  showAssignee: boolean;
  /** Enables row checkboxes and the bulk delete bar. */
  onDeleteTasks?: (ids: string[]) => Promise<boolean>;
  /** Only tasks passing this can change status or be selected for bulk delete. */
  canEditTask?: (task: TaskItem) => boolean;
}

/** Quiet mono column heads: visible from sm, screen-reader only on phones. */
const HEAD = cn(EYEBROW, "h-8 font-normal max-sm:h-0 max-sm:p-0");
const headLabel = "max-sm:sr-only";

/** One dense table; collapsible group header rows carry the counts. */
export function TaskTableView({
  tasks,
  groupBy,
  getContextLabel,
  onDeleteTasks,
  canEditTask = () => true,
  onUpdateStatus,
  ...rowProps
}: TaskTableViewProps) {
  const selectable = (t: TaskItem) => Boolean(onDeleteTasks) && canEditTask(t);
  const groups = React.useMemo(
    () => groupTasksForList(tasks, groupBy),
    [tasks, groupBy],
  );
  const [collapsed, setCollapsed] = React.useState<Set<string>>(
    () => new Set(),
  );
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set());
  // Derived so ids of tasks that disappeared never count (and drop out on the next toggle).
  const selected = new Set(
    tasks.filter((t) => picked.has(t.id) && selectable(t)).map((t) => t.id),
  );
  const toggleTasks = (ids: string[], on: boolean) => {
    const next = new Set(selected);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    setPicked(next);
  };
  // Status column onward; the select column (when present) sits before it.
  const spanFromStatus = rowProps.showAssignee ? 5 : 4;

  return (
    <div className="bg-background h-full overflow-auto">
      {/* First/last cells take the workspace gutter so rows share the board's left edge. */}
      <Table className="[&_tr>*:first-child]:pl-4 [&_tr>*:last-child]:pr-4 sm:[&_tr>*:first-child]:pl-5 sm:[&_tr>*:last-child]:pr-5">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {onDeleteTasks && (
              <TableHead className={cn(HEAD, "w-0")}>
                <span className="sr-only">Select</span>
              </TableHead>
            )}
            <TableHead className={cn(HEAD, "w-0")}>
              <span className="sr-only">Status</span>
            </TableHead>
            <TableHead className={HEAD}>
              <span className={headLabel}>Task</span>
            </TableHead>
            {/* Phones fold priority and due into the title cell's meta line. */}
            <TableHead className={cn(HEAD, "max-sm:hidden")}>
              <span className={headLabel}>Priority</span>
            </TableHead>
            <TableHead className={cn(HEAD, "text-right max-sm:hidden")}>
              <span className={headLabel}>Due</span>
            </TableHead>
            {rowProps.showAssignee && (
              <TableHead className={cn(HEAD, "w-0")}>
                <span className="sr-only">Assignee</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((g) => {
            const isOpen = !collapsed.has(g.id);
            return (
              <React.Fragment key={g.id}>
                {/* Flat group row: chevron in the status column, mono label on the title edge. */}
                <TableRow className="group/row border-b-0 hover:bg-transparent has-aria-expanded:bg-transparent">
                  {onDeleteTasks && (
                    <TableCell className="w-0 pt-5 pb-1.5">
                      {g.tasks.some(selectable) && (
                        <GroupCheckbox
                          label={g.label}
                          ids={g.tasks.filter(selectable).map((t) => t.id)}
                          selected={selected}
                          anySelected={selected.size > 0}
                          onToggle={toggleTasks}
                        />
                      )}
                    </TableCell>
                  )}
                  <TableCell colSpan={spanFromStatus} className="pt-5 pb-1.5">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => toggle(g.id)}
                      className="group/toggle flex items-center gap-4 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="grid size-6 place-items-center text-muted-foreground group-hover/toggle:text-foreground">
                        <ChevronDown
                          aria-hidden
                          className={cn(
                            "size-3.5 transition-transform",
                            !isOpen && "-rotate-90",
                          )}
                        />
                      </span>
                      <span className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            EYEBROW,
                            "group-hover/toggle:text-foreground",
                            g.destructive && "text-destructive",
                          )}
                        >
                          {g.label}
                        </span>
                        <span
                          className={cn(
                            MONO_META,
                            g.destructive
                              ? "text-destructive"
                              : "text-muted-foreground",
                          )}
                        >
                          {g.tasks.length}
                        </span>
                      </span>
                    </button>
                  </TableCell>
                </TableRow>
                {isOpen &&
                  g.tasks.map((task) => (
                    <TaskTableRow
                      key={task.id}
                      task={task}
                      contextLabel={getContextLabel?.(task)}
                      selected={selected.has(task.id)}
                      anySelected={selected.size > 0}
                      selectable={selectable(task)}
                      onToggleSelect={
                        onDeleteTasks
                          ? (id) => toggleTasks([id], !selected.has(id))
                          : undefined
                      }
                      onUpdateStatus={
                        canEditTask(task) ? onUpdateStatus : undefined
                      }
                      {...rowProps}
                    />
                  ))}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
      {onDeleteTasks && selected.size > 0 && (
        <TaskBulkActionBar
          count={selected.size}
          onDelete={() => onDeleteTasks([...selected])}
          onClear={() => setPicked(new Set())}
        />
      )}
    </div>
  );
}

/** Tri-state select-all for one group header. */
function GroupCheckbox({
  label,
  ids,
  selected,
  anySelected,
  onToggle,
}: {
  label: string;
  ids: string[];
  selected: ReadonlySet<string>;
  anySelected: boolean;
  onToggle: (ids: string[], on: boolean) => void;
}) {
  const count = ids.filter((id) => selected.has(id)).length;
  return (
    <Checkbox
      checked={count > 0 && count === ids.length}
      indeterminate={count > 0 && count < ids.length}
      onCheckedChange={(on) => onToggle(ids, on)}
      aria-label={`Select all in ${label}`}
      className={cn(
        !anySelected &&
          "focus-visible:opacity-100 group-hover/row:opacity-100 [@media(hover:hover)]:opacity-0",
      )}
    />
  );
}
