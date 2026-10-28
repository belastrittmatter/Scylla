"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskTableRow } from "./task-table-row";
import type { TaskItem, TaskStatus } from "./task-types";

type SortField = "title" | "status" | "priority" | "assignee" | "dueDate";
type SortDirection = "asc" | "desc";

interface TaskTableViewProps {
  tasks: TaskItem[];
  onSelectTask?: (task: TaskItem) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
}

export function TaskTableView({ tasks, onSelectTask, onUpdateStatus }: TaskTableViewProps) {
  const [sortField, setSortField] = React.useState<SortField>("dueDate");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "priority": {
          const pOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison =
            (pOrder[b.priority as keyof typeof pOrder] || 0) -
            (pOrder[a.priority as keyof typeof pOrder] || 0);
          break;
        }
        case "assignee":
          comparison = (a.assignee?.name || "").localeCompare(b.assignee?.name || "");
          break;
        case "dueDate": {
          const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = timeA - timeB;
          break;
        }
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [tasks, sortField, sortDirection]);

  return (
    <div className="h-full w-full overflow-auto p-6">
      <div className="shadow-xs overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900/90">
        <Table>
          <TableHeader className="bg-neutral-50/80 dark:bg-neutral-800/60">
            <TableRow>
              <TableHead
                className="cursor-pointer py-3.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                onClick={() => toggleSort("title")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Task Title</span>
                  <ArrowUpDown className="size-3.5 text-neutral-400" />
                </div>
              </TableHead>

              <TableHead
                className="w-[140px] cursor-pointer py-3.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                onClick={() => toggleSort("status")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="size-3.5 text-neutral-400" />
                </div>
              </TableHead>

              <TableHead
                className="w-[110px] cursor-pointer py-3.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                onClick={() => toggleSort("priority")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="size-3.5 text-neutral-400" />
                </div>
              </TableHead>

              <TableHead
                className="w-[160px] cursor-pointer py-3.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                onClick={() => toggleSort("assignee")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Assignee</span>
                  <ArrowUpDown className="size-3.5 text-neutral-400" />
                </div>
              </TableHead>

              <TableHead
                className="w-[140px] cursor-pointer py-3.5 text-right text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                onClick={() => toggleSort("dueDate")}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Deadline</span>
                  <ArrowUpDown className="size-3.5 text-neutral-400" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedTasks.map((task) => (
              <TaskTableRow
                key={task.id}
                task={task}
                onSelectTask={onSelectTask}
                onUpdateStatus={onUpdateStatus}
              />
            ))}

            {sortedTasks.length === 0 && (
              <TableRow>
                <td colSpan={5} className="h-32 text-center text-sm text-neutral-400">
                  No tasks matching the selected filters.
                </td>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
