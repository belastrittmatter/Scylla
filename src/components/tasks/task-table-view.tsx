"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
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
  /** Only tasks passing this can be selected for bulk delete. */
  canDeleteTask?: (task: TaskItem) => boolean;
}

/** One dense table; collapsible group header rows carry the counts. */
export function TaskTableView({
  tasks,
  groupBy,
  getContextLabel,
  onDeleteTasks,
  canDeleteTask = () => true,
  ...rowProps
}: TaskTableViewProps) {
  const selectable = (t: TaskItem) =>
    Boolean(onDeleteTasks) && canDeleteTask(t);
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
  const columnCount = (rowProps.showAssignee ? 5 : 4) + (onDeleteTasks ? 1 : 0);

  return (
    <div className="bg-background h-full overflow-auto">
      <Table>
        <TableBody>
          {groups.map((g) => {
            const isOpen = !collapsed.has(g.id);
            return (
              <React.Fragment key={g.id}>
                <TableRow className="group/row bg-muted/50 hover:bg-muted/50">
                  <TableCell colSpan={columnCount} className="py-1">
                    <div className="flex items-center gap-2">
                      {g.tasks.some(selectable) && (
                        <GroupCheckbox
                          label={g.label}
                          ids={g.tasks.filter(selectable).map((t) => t.id)}
                          selected={selected}
                          anySelected={selected.size > 0}
                          onToggle={toggleTasks}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-expanded={isOpen}
                        onClick={() => toggle(g.id)}
                        className={cn(g.destructive && "text-destructive")}
                      >
                        <ChevronDown
                          className={cn(
                            "transition-transform",
                            !isOpen && "-rotate-90",
                          )}
                        />
                        {g.label}
                        <Badge
                          variant={g.destructive ? "destructive" : "secondary"}
                        >
                          {g.tasks.length}
                        </Badge>
                      </Button>
                    </div>
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
        "opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100",
        anySelected && "opacity-100",
      )}
    />
  );
}
