"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";
import { McpHeaderControls } from "@/components/mcp-ui/mcp-header-controls";
import { toTaskItem } from "@/components/mcp-ui/task-board-mapping";
import {
  extractData,
  type TaskBoardData,
  useMcpBridge,
} from "@/components/mcp-ui/use-mcp-bridge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KanbanBoardView } from "@/components/tasks/kanban-board-view";
import { TASK_FORM_STATUSES } from "@/components/tasks/task-types";

const COLUMNS = TASK_FORM_STATUSES.map((s) => ({
  id: s.value,
  title: s.label,
}));

const PRIORITIES = [
  ["all", "All"],
  ["urgent", "Urgent"],
  ["high", "High"],
  ["medium", "Medium"],
  ["low", "Low"],
] as const;

const DEFAULT_HIDDEN_COLS: Record<string, boolean> = {
  in_review: true,
  cancelled: true,
};

export function TaskBoardApp({
  initialData,
}: {
  readonly initialData?: unknown;
}): React.JSX.Element {
  const { data, setData, callTool } = useMcpBridge<TaskBoardData>(initialData);
  const [prio, setPrio] = React.useState("all");
  const [hiddenCols, setHiddenCols] =
    React.useState<Record<string, boolean>>(DEFAULT_HIDDEN_COLS);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const boardTasks = (data?.tasks ?? [])
    .map(toTaskItem)
    .filter((t) => prio === "all" || t.priority === prio);
  const titleText = data
    ? `${data.teamName || "Team"}${data.projectName ? ` · ${data.projectName}` : " · Task Board"}`
    : "Task Board";
  const visibleCols = COLUMNS.filter((c) => !hiddenCols[c.id]);
  const hiddenColList = COLUMNS.filter((c) => hiddenCols[c.id]);

  // Show/hide buttons are disabled at the 3-column max / 1-column min.
  const setHidden = (colId: string, hidden: boolean) =>
    setHiddenCols((p) => ({ ...p, [colId]: hidden }));

  const handleSync = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      const res = await callTool("get_task_board", {
        teamId: data?.teamId || data?.teamName || undefined,
        projectId: data?.projectId || undefined,
      });
      const updated = extractData<TaskBoardData>(res);
      if (updated) setData(updated);
    } catch {
      // ignore
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card
      size="sm"
      className="border-border bg-card text-card-foreground shadow-xs"
    >
      <CardHeader className="border-border/60 border-b">
        <CardTitle id="title" className="text-sm font-semibold">
          {titleText}
        </CardTitle>
        <CardDescription
          id="kb-status"
          className="text-muted-foreground text-xs"
        >
          Read-only board
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center gap-1.5">
            <Tabs value={prio} onValueChange={(v) => setPrio(String(v))}>
              <TabsList aria-label="Priority">
                {PRIORITIES.map(([key, label]) => (
                  <TabsTrigger key={key} value={key}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <McpHeaderControls
              isSyncing={isSyncing}
              onSync={() => void handleSync()}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-2">
        {hiddenColList.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground text-[11px]">
              Hidden columns:
            </span>
            {hiddenColList.map((col) => (
              <Button
                key={col.id}
                variant="outline"
                size="xs"
                aria-label={`Show ${col.title} column`}
                disabled={visibleCols.length >= 3}
                title={`Show ${col.title} column`}
                onClick={() => setHidden(col.id, false)}
                className="gap-1"
              >
                <EyeIcon className="size-3" />
                <span>
                  {col.title} (
                  {boardTasks.filter((t) => t.status === col.id).length})
                </span>
              </Button>
            ))}
            {visibleCols.length >= 3 && (
              <span className="text-muted-foreground/70 text-[10px]">
                (max 3 visible)
              </span>
            )}
          </div>
        )}
        {!data ? (
          <div className="border-border bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
            Loading tasks...
          </div>
        ) : (
          <KanbanBoardView
            tasks={boardTasks}
            readOnly
            columns={visibleCols}
            className="max-h-[440px] gap-2 p-0 pb-1"
            renderColumnAction={(colId) => (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Hide ${COLUMNS.find((c) => c.id === colId)?.title} column`}
                disabled={visibleCols.length <= 1}
                onClick={() => setHidden(colId, true)}
                className="text-muted-foreground hover:text-foreground size-5"
              >
                <EyeOffIcon className="size-3" />
              </Button>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}
