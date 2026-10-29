"use client";

import * as React from "react";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaskViewSwitchBarProps {
  viewMode: "kanban" | "table";
  onViewModeChange: (mode: "kanban" | "table") => void;
  taskCount: number;
}

export function TaskViewSwitchBar({
  viewMode,
  onViewModeChange,
  taskCount,
}: TaskViewSwitchBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200/60 bg-white/50 px-6 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
      <Tabs
        value={viewMode}
        onValueChange={(val) => {
          if (val === "kanban" || val === "table") {
            onViewModeChange(val);
          }
        }}
      >
        <TabsList>
          <TabsTrigger
            value="kanban"
            className="cursor-pointer px-3 py-1 text-sm font-medium"
          >
            <LayoutGrid className="mr-1.5 size-4" />
            Board
          </TabsTrigger>
          <TabsTrigger
            value="table"
            className="cursor-pointer px-3 py-1 text-sm font-medium"
          >
            <TableIcon className="mr-1.5 size-4" />
            Table
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        Showing{" "}
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
          {taskCount}
        </span>{" "}
        {taskCount === 1 ? "task" : "tasks"}
      </div>
    </div>
  );
}
