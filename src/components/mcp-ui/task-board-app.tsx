"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";
import { McpHeaderControls } from "@/components/mcp-ui/mcp-header-controls";
import {
  extractData,
  type KanbanTask,
  type TaskBoardData,
  useMcpBridge,
} from "@/components/mcp-ui/use-mcp-bridge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
  { id: "cancelled", label: "Cancelled" },
] as const;

const PRIORITIES = [
  ["all", "All"],
  ["urgent", "Urgent"],
  ["high", "High"],
  ["medium", "Medium"],
  ["low", "Low"],
] as const;

const PRIO_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
};

function parseTimestampMs(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const s = String(val).trim();
  if (!s) return 0;
  if (s.endsWith("Z") || /[+-]\d{2}(:\d{2})?$/.test(s)) {
    return new Date(s).getTime();
  }
  const norm = s.replace(" ", "T");
  return new Date(norm.endsWith("Z") ? norm : `${norm}Z`).getTime();
}

function formatLiveTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatCompactTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  if (mins > 0) return `${mins}m`;
  return `${s}s`;
}

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
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = React.useState<string | null>(null);
  const [statusMsg, setStatusMsg] = React.useState(
    "Drag cards between columns to update status",
  );
  const [expandedTaskIds, setExpandedTaskIds] = React.useState<
    Record<string, boolean>
  >({});
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());

  const allTasks = data?.tasks ?? [];

  React.useEffect(() => {
    const hasActive = allTasks.some(
      (t) => t.status === "in_progress" && Boolean(t.activeSessionStartedAt),
    );
    if (!hasActive) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [allTasks]);

  const filteredTasks =
    prio === "all"
      ? allTasks
      : allTasks.filter((t) => (t.priority || "medium").toLowerCase() === prio);
  const titleText = data
    ? `${data.teamName || "Team"}${data.projectName ? ` · ${data.projectName}` : " · Task Board"}`
    : "Task Board";
  const visibleCols = COLUMNS.filter((c) => !hiddenCols[c.id]);
  const hiddenColList = COLUMNS.filter((c) => hiddenCols[c.id]);

  const handleShowColumn = (colId: string) => {
    if (visibleCols.length >= 3) {
      setStatusMsg("Max 3 columns visible. Hide a column first.");
      return;
    }
    setHiddenCols((p) => ({ ...p, [colId]: false }));
  };

  const handleHideColumn = (colId: string) => {
    if (visibleCols.length <= 1) {
      setStatusMsg("At least 1 column must remain visible");
      return;
    }
    setHiddenCols((p) => ({ ...p, [colId]: true }));
  };

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

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    newStatus: string,
  ): Promise<void> => {
    e.preventDefault();
    setDragOverCol(null);
    const id = draggedId || e.dataTransfer?.getData("text/plain");
    setDraggedId(null);
    const target = data?.tasks?.find((t) => String(t.id) === String(id));
    if (!id || !target || target.status === newStatus) return;

    const prevTask = { ...target };
    const prevStatus = target.status;
    const nowTs = Date.now();

    const updateLocal = (st: string) =>
      setData((prev) =>
        prev
          ? {
              ...prev,
              tasks: (prev.tasks ?? []).map((t): KanbanTask => {
                if (String(t.id) !== String(id)) return t;
                if (st === "in_progress" && t.status !== "in_progress") {
                  return {
                    ...t,
                    status: st,
                    activeSessionStartedAt: new Date(nowTs).toISOString(),
                  };
                }
                if (t.status === "in_progress" && st !== "in_progress") {
                  const elapsed = t.activeSessionStartedAt
                    ? Math.max(
                        0,
                        Math.floor(
                          (nowTs - parseTimestampMs(t.activeSessionStartedAt)) /
                            1000,
                        ),
                      )
                    : 0;
                  return {
                    ...t,
                    status: st,
                    totalSpentSeconds: (t.totalSpentSeconds || 0) + elapsed,
                    activeSessionStartedAt: null,
                  };
                }
                return { ...t, status: st };
              }),
            }
          : prev,
      );

    updateLocal(newStatus);
    setStatusMsg(`Saving "${target.title}"...`);
    try {
      await callTool("update_task", { taskId: target.id, status: newStatus });
      setStatusMsg(
        `Saved "${target.title}" → ${newStatus.replace("_", " ")} ✓`,
      );
    } catch {
      setData((prev) =>
        prev
          ? {
              ...prev,
              tasks: (prev.tasks ?? []).map((t): KanbanTask =>
                String(t.id) === String(id) ? prevTask : t,
              ),
            }
          : prev,
      );
      setStatusMsg("Failed to sync status change with DB");
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
          {statusMsg}
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="bg-muted flex flex-wrap items-center gap-1 rounded-lg p-1">
              {PRIORITIES.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPrio(key)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                    prio === key
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
                aria-label={`Show ${col.label} column`}
                disabled={visibleCols.length >= 3}
                title={
                  visibleCols.length >= 3
                    ? "Max 3 columns visible. Hide a column first."
                    : `Show ${col.label} column`
                }
                onClick={() => handleShowColumn(col.id)}
                className="gap-1"
              >
                <EyeIcon className="size-3" />
                <span>
                  {col.label} (
                  {filteredTasks.filter((t) => t.status === col.id).length})
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
          <div
            className="grid gap-2 overflow-x-auto pb-1"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, Math.min(3, visibleCols.length))}, minmax(0, 1fr))`,
            }}
          >
            {visibleCols.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCol(col.id);
                  }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => void handleDrop(e, col.id)}
                  className={`flex max-h-[440px] min-h-[160px] flex-col rounded-lg border p-2 transition-colors ${
                    dragOverCol === col.id
                      ? "border-foreground bg-muted border-dashed"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="mb-2 flex shrink-0 items-center justify-between gap-1 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{col.label}</span>
                      <Badge
                        variant="outline"
                        className="bg-background h-4 px-1.5 text-[10px]"
                      >
                        {colTasks.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Hide ${col.label} column`}
                      title={
                        visibleCols.length <= 1
                          ? "At least 1 column must be visible"
                          : `Hide ${col.label} column`
                      }
                      disabled={visibleCols.length <= 1}
                      onClick={() => handleHideColumn(col.id)}
                      className="text-muted-foreground hover:text-foreground size-5"
                    >
                      <EyeOffIcon className="size-3" />
                    </Button>
                  </div>
                  <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
                    {colTasks.length === 0 ? (
                      <div className="text-muted-foreground flex flex-1 items-center justify-center py-6 text-center text-[11px]">
                        Drop tasks here
                      </div>
                    ) : (
                      colTasks.map((t) => {
                        const pr = (t.priority || "medium").toLowerCase();
                        const isActive =
                          t.status === "in_progress" &&
                          Boolean(t.activeSessionStartedAt);
                        const activeElapsed =
                          isActive && t.activeSessionStartedAt
                            ? Math.max(
                                0,
                                Math.floor(
                                  (now -
                                    parseTimestampMs(
                                      t.activeSessionStartedAt,
                                    )) /
                                    1000,
                                ),
                              )
                            : 0;
                        const totalSpent =
                          (t.totalSpentSeconds || 0) + activeElapsed;
                        const estMinutes =
                          t.estimatedMinutes ??
                          (t.status === "in_progress" ? 60 : null);
                        const estSeconds = estMinutes ? estMinutes * 60 : null;
                        const ratio = estSeconds ? totalSpent / estSeconds : 0;
                        const percent = Math.min(100, Math.round(ratio * 100));
                        const barColor =
                          ratio > 1
                            ? "bg-red-500"
                            : ratio >= 0.8
                              ? "bg-amber-500"
                              : "bg-blue-500";
                        const showTimer = t.status === "in_progress";
                        const showTimeSpent = !showTimer && totalSpent > 0;

                        return (
                          <div
                            key={t.id}
                            draggable="true"
                            onDragStart={(e) => {
                              setDraggedId(t.id);
                              try {
                                e.dataTransfer.setData("text/plain", t.id);
                              } catch {
                                /* ignore */
                              }
                            }}
                            onClick={() =>
                              setExpandedTaskIds((p) => ({
                                ...p,
                                [t.id]: !p[t.id],
                              }))
                            }
                            className="border-border bg-card shadow-2xs hover:border-foreground/30 cursor-grab rounded-md border p-2 transition-all active:cursor-grabbing"
                          >
                            <div className="line-clamp-2 text-xs font-medium leading-snug">
                              {t.title}
                            </div>
                            {t.description && expandedTaskIds[t.id] && (
                              <div className="text-muted-foreground border-border/40 mt-1 border-t pt-1 text-[11px] leading-relaxed">
                                {t.description}
                              </div>
                            )}

                            {showTimer && (
                              <div className="mt-1.5 space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <div
                                    data-testid="task-timer"
                                    className="text-foreground/90 flex items-center gap-1.5 font-medium"
                                  >
                                    <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                                    <span>⏱ {formatLiveTimer(totalSpent)}</span>
                                  </div>
                                  {estMinutes ? (
                                    <span className="text-muted-foreground text-[10px]">
                                      Est: {formatCompactTime(estSeconds || 0)}
                                    </span>
                                  ) : null}
                                </div>
                                {estSeconds ? (
                                  <div
                                    data-testid="task-progress"
                                    className="bg-muted h-1 w-full overflow-hidden rounded-full"
                                    title={`${Math.round(ratio * 100)}% of budget used`}
                                  >
                                    <div
                                      className={`h-full transition-all ${barColor}`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                ) : null}
                              </div>
                            )}

                            {showTimeSpent && (
                              <div className="mt-1.5 space-y-1">
                                <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                                  <span>⏱ {formatCompactTime(totalSpent)}</span>
                                  {estMinutes ? (
                                    <span>
                                      Est: {formatCompactTime(estSeconds || 0)}
                                    </span>
                                  ) : null}
                                </div>
                                {estSeconds ? (
                                  <div
                                    data-testid="task-progress"
                                    className="bg-muted h-1 w-full overflow-hidden rounded-full"
                                    title={`${Math.round(ratio * 100)}% of budget used`}
                                  >
                                    <div
                                      className={`h-full transition-all ${barColor}`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                ) : null}
                              </div>
                            )}

                            <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground flex items-center gap-1 font-medium capitalize">
                                  <span
                                    className={`size-1.5 rounded-full ${PRIO_DOT[pr] || "bg-zinc-400"}`}
                                  />
                                  {pr}
                                </span>
                                {!isActive &&
                                totalSpent === 0 &&
                                t.estimatedMinutes ? (
                                  <span className="text-muted-foreground/75 font-normal">
                                    ~
                                    {t.estimatedMinutes >= 60
                                      ? `${Math.floor(t.estimatedMinutes / 60)}h`
                                      : `${t.estimatedMinutes}m`}
                                  </span>
                                ) : null}
                              </div>
                              {t.assigneeName && (
                                <span className="text-muted-foreground max-w-[90px] truncate text-[10px]">
                                  {t.assigneeName}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
