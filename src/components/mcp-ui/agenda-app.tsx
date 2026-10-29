"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { McpHeaderControls } from "@/components/mcp-ui/mcp-header-controls";
import {
  getIctMinutes,
  getTimelinePercent,
} from "@/components/mcp-ui/schedule-helpers";
import {
  type AgendaData,
  type AgendaEvent,
  extractData,
  fmtDay,
  fmtTime,
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

const WORK_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const;

function getDayHours(dayEvents: readonly AgendaEvent[]): number[] {
  const hours = new Set<number>(WORK_HOURS);
  for (const ev of dayEvents)
    hours.add(Math.floor(getIctMinutes(ev.start) / 60));
  return Array.from(hours).sort((a, b) => a - b);
}

// shortcut: character-based width estimate (~1.2 chars per 1% timeline width), upgrade to ResizeObserver if variable font widths matter
export function formatTimelineBlockLabel(
  title: string,
  widthPct: number,
): string {
  if (widthPct < 6) return "";
  const maxChars = Math.floor(widthPct * 1.2);
  if (title.length <= maxChars) return title;
  if (maxChars <= 3) return "";
  return `${title.slice(0, maxChars - 3).trimEnd()}...`;
}

export function AgendaApp({
  initialData,
}: {
  readonly initialData?: unknown;
}): React.JSX.Element {
  const { data, setData, callTool } = useMcpBridge<AgendaData>(initialData);
  const [curDay, setCurDay] = React.useState("");
  const [expandedMap, setExpandedMap] = React.useState<Record<string, boolean>>(
    {},
  );
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      const res = await callTool("get_my_agenda", {
        date: data?.baseDate || undefined,
      });
      const updated = extractData<AgendaData>(res);
      if (updated) setData(updated);
    } catch {
      // ignore if host unsupported
    } finally {
      setIsSyncing(false);
    }
  };

  const events = data?.events ?? [];
  const groups: Record<string, AgendaEvent[]> = {};
  for (const ev of events) {
    const dayKey = fmtDay(ev.start);
    (groups[dayKey] ??= []).push(ev);
  }

  const dayKeys = Object.keys(groups);
  const activeDay = groups[curDay] ? curDay : (dayKeys[0] ?? "");
  const activeDayIndex = dayKeys.indexOf(activeDay);
  const visibleDays = activeDay ? [activeDay] : [];
  const titleText = data?.user?.name
    ? `Calendar Agenda · ${data.user.name}`
    : "Calendar Agenda";
  const subText = data?.baseDate
    ? `Starting ${data.baseDate} (ICT)`
    : "Upcoming Schedule";

  return (
    <Card
      size="sm"
      className="border-border bg-card text-card-foreground shadow-xs"
    >
      <CardHeader className="border-border/60 border-b">
        <CardTitle id="title" className="text-sm font-semibold">
          {titleText}
        </CardTitle>
        <CardDescription id="date" className="text-muted-foreground text-xs">
          {subText}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="bg-muted/50 gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span id="count">
                {events.length} event{events.length === 1 ? "" : "s"}
              </span>
            </Badge>
            <McpHeaderControls
              isSyncing={isSyncing}
              onSync={() => void handleSync()}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {dayKeys.length > 1 && (
          <div
            data-slot="agenda-pagination"
            className="bg-muted/50 flex flex-wrap items-center justify-between gap-1.5 rounded-lg p-1"
          >
            <div className="flex flex-wrap items-center gap-1">
              {dayKeys.map((d) => (
                <Button
                  key={d}
                  size="xs"
                  variant={activeDay === d ? "default" : "ghost"}
                  onClick={() => setCurDay(d)}
                >
                  {d}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                aria-label="Previous day"
                disabled={activeDayIndex <= 0}
                onClick={() =>
                  activeDayIndex > 0 && setCurDay(dayKeys[activeDayIndex - 1])
                }
              >
                <ChevronLeftIcon className="size-3.5" />
              </Button>
              <Badge variant="outline" className="tabular-nums">
                {activeDayIndex + 1} / {dayKeys.length}
              </Badge>
              <Button
                variant="outline"
                size="icon-xs"
                aria-label="Next day"
                disabled={activeDayIndex >= dayKeys.length - 1}
                onClick={() =>
                  activeDayIndex < dayKeys.length - 1 &&
                  setCurDay(dayKeys[activeDayIndex + 1])
                }
              >
                <ChevronRightIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
        {!data ? (
          <div className="border-border bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
            Loading agenda...
          </div>
        ) : events.length === 0 ? (
          <div className="border-border bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
            No events scheduled for this period.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleDays.map((day) => {
              const dayEvents = groups[day] || [];
              return (
                <div key={day} className="space-y-2">
                  <div className="text-muted-foreground flex items-center justify-between text-[11px] font-semibold">
                    <span>{day}</span>
                    <span>08:00 – 18:00 ICT · 12:00–13:00 Break</span>
                  </div>
                  <div className="border-border bg-muted/25 relative h-7 overflow-hidden rounded-md border">
                    <div
                      style={{ left: "40%", width: "10%" }}
                      title="12:00 – 13:00 Lunch Break"
                      className="border-border bg-muted/80 text-muted-foreground absolute inset-y-0 flex items-center justify-center border-x border-dashed text-[9px] font-medium"
                    >
                      Break
                    </div>
                    {dayEvents.map((ev, i) => {
                      const sPct = getTimelinePercent(getIctMinutes(ev.start));
                      const rawWidth =
                        getTimelinePercent(getIctMinutes(ev.end)) - sPct;
                      const width = Math.max(2, rawWidth);
                      const fullTitle = ev.title || ev.summary || "Busy";
                      const label = formatTimelineBlockLabel(fullTitle, width);
                      return (
                        <div
                          key={ev.id || `${ev.start}-${i}`}
                          title={fullTitle}
                          style={{ left: `${sPct}%`, width: `${width}%` }}
                          className="shadow-2xs absolute inset-y-1 flex items-center overflow-hidden whitespace-nowrap rounded bg-blue-500/85 px-1 text-[10px] font-medium text-white"
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>
                  <div className="divide-border/60 border-border bg-card divide-y overflow-hidden rounded-lg border">
                    {getDayHours(dayEvents).map((h) => {
                      const isBreak = h === 12;
                      const hourLabel = `${String(h).padStart(2, "0")}:00`;
                      const hourEvents = dayEvents.filter(
                        (ev) => Math.floor(getIctMinutes(ev.start) / 60) === h,
                      );
                      return (
                        <div
                          key={h}
                          data-timeline-hour={hourLabel}
                          data-break-hour={isBreak ? "true" : undefined}
                          className={`flex items-stretch text-xs ${isBreak ? "bg-muted/60 text-muted-foreground" : "bg-card"}`}
                        >
                          <div className="border-border/60 text-muted-foreground flex w-16 shrink-0 items-center justify-between border-r px-2 py-1.5 text-[11px] font-medium tabular-nums">
                            <span>{hourLabel}</span>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-2.5 py-1">
                            {isBreak && (
                              <div className="text-muted-foreground flex items-center justify-between text-[11px] italic">
                                <span>
                                  12:00 – 13:00 · Break (Outside regular working
                                  hours)
                                </span>
                              </div>
                            )}
                            {hourEvents.map((ev, idx) => {
                              const rowKey = ev.id || `${ev.start}-${idx}`;
                              const timeRange = ev.start.includes("T")
                                ? `${fmtTime(ev.start)} – ${fmtTime(ev.end)}`
                                : "All day";
                              return (
                                <div
                                  key={rowKey}
                                  onClick={() =>
                                    setExpandedMap((p) => ({
                                      ...p,
                                      [rowKey]: !p[rowKey],
                                    }))
                                  }
                                  className="text-foreground flex cursor-pointer items-center justify-between gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 transition-colors hover:bg-blue-500/15"
                                >
                                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                    <span className="shrink-0 font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                                      {timeRange}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate font-medium">
                                        {ev.title || ev.summary || "Untitled"}
                                      </div>
                                      <div className="text-muted-foreground truncate text-[11px]">
                                        {ev.location ||
                                          (ev.meetingUrl
                                            ? "Google Meet"
                                            : "No location")}
                                        {expandedMap[rowKey]
                                          ? ` · Status: ${ev.status || "confirmed"}`
                                          : ""}
                                      </div>
                                    </div>
                                  </div>
                                  {ev.meetingUrl && (
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      onClick={(e) => e.stopPropagation()}
                                      render={
                                        <a
                                          href={ev.meetingUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        />
                                      }
                                    >
                                      Join Meet ↗
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
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
