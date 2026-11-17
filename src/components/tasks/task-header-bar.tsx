"use client";

import * as React from "react";
import { ChartGantt, LayoutGrid, List, Plus, Search } from "lucide-react";
import { HeaderSlot } from "@/components/layout/header-slot";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TaskFilterMenu } from "./task-filter-menu";
import { parseTaskViewMode } from "./task-view-mode";
import type { TaskFilterDef } from "./task-filter-defs";
import type { TaskViewMode } from "./task-scope-content";
import type { TaskScope } from "./task-selectors";

const SCOPE_TABS: Array<{ value: TaskScope; label: string }> = [
  { value: "me", label: "Me" },
  { value: "team", label: "Team" },
];

const VIEWS = [
  { value: "list", label: "List", Icon: List },
  { value: "board", label: "Board", Icon: LayoutGrid },
  { value: "timeline", label: "Timeline", Icon: ChartGantt },
] as const;

interface TaskHeaderBarProps {
  scope: TaskScope;
  onScopeChange: (scope: TaskScope) => void;
  /** Team scope `Team ▾ / Project ▾` items (TaskTeamBreadcrumb). */
  crumbs?: React.ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterDefs: TaskFilterDef[];
  viewMode: TaskViewMode;
  onViewModeChange: (mode: TaskViewMode) => void;
  /** Omitted when the user may not create tasks here. */
  onNewTask?: () => void;
}

/** The /tasks controls, rendered into the global ViewHeader (one bar). */
export function TaskHeaderBar({
  scope,
  onScopeChange,
  crumbs,
  searchQuery,
  onSearchChange,
  filterDefs,
  viewMode,
  onViewModeChange,
  onNewTask,
}: TaskHeaderBarProps) {
  return (
    <HeaderSlot>
      {/* Slot items flow into ViewHeader. Left: one path `Tasks / Team ▾ / Project ▾`.
          Right: scope toggle, then tools. Below md, row 1 = path, row 2 = scope + tools. */}
      <h1 className="order-1 text-sm font-semibold md:order-none">Tasks</h1>
      {crumbs && (
        <>
          <span
            aria-hidden="true"
            // -mr-1 offsets the ghost crumb's padding so the "/" sits centered.
            className="order-1 -mr-1 text-[13px] text-muted-foreground/50 md:order-none"
          >
            /
          </span>
          <Breadcrumb className="order-2 min-w-0 md:order-none">
            <BreadcrumbList className="flex-nowrap gap-1 text-[13px] sm:gap-1">
              {crumbs}
            </BreadcrumbList>
          </Breadcrumb>
        </>
      )}
      <Tabs
        className="order-4 md:order-none md:ml-auto"
        value={scope}
        onValueChange={(val) => {
          const next = SCOPE_TABS.find((t) => t.value === val);
          if (next) onScopeChange(next.value);
        }}
      >
        <TabsList variant="segmented" aria-label="Task scope">
          {SCOPE_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="px-2.5">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div aria-hidden className="order-3 basis-full md:hidden" />
      <div className="order-5 ml-auto flex shrink-0 items-center gap-1.5 md:order-none md:ml-0 md:border-l md:border-border md:pl-2">
        {/* Collapses to its icon below md; expands while focused or holding a query. */}
        <InputGroup className="w-8 overflow-hidden transition-[width] focus-within:w-40 has-[input:not(:placeholder-shown)]:w-40 md:w-32 xl:w-48">
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            aria-label="Search tasks"
          />
        </InputGroup>
        <TaskFilterMenu defs={filterDefs} />
        <Tabs
          value={viewMode}
          onValueChange={(v) => {
            const next = parseTaskViewMode(String(v));
            if (next) onViewModeChange(next);
          }}
        >
          <TabsList variant="segmented" aria-label="Layout">
            {VIEWS.map(({ value, label, Icon }) => (
              <Tooltip key={value}>
                <TooltipTrigger
                  render={<TabsTrigger value={value} aria-label={label} />}
                >
                  <Icon />
                </TooltipTrigger>
                <TooltipContent side="bottom">{label}</TooltipContent>
              </Tooltip>
            ))}
          </TabsList>
        </Tabs>
        {onNewTask && (
          <Button onClick={onNewTask} aria-label="New task">
            <Plus />
            <span className="hidden xl:inline">New task</span>
          </Button>
        )}
      </div>
    </HeaderSlot>
  );
}
