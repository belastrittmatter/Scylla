"use client";

import * as React from "react";
import { format, addMinutes } from "date-fns";
import { toast } from "sonner";
import { EventCalendar } from "@/components/reui/event-calendar/event-calendar";
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content";
import { getViewDateRange } from "@/components/reui/event-calendar/event-calendar-lib";
import type {
  CalendarEvent,
  CalendarView,
  EventCalendarRangeInfo,
  EventCalendarProposedUpdate,
  EventCalendarSlotDraft,
  EventCalendarSlotInfo,
} from "@/components/reui/event-calendar/event-calendar-types";
import { type CustomEventData } from "@/mock-data/calendar-events";
import type { CalendarAttendeeItem } from "@/components/calendar/calendar-attendee-types";
import {
  CalendarToolbar,
  CalendarMobileDayLock,
} from "@/components/calendar/calendar-toolbar";
import { CalendarTeamPanel } from "@/components/calendar/calendar-team-panel";
import { CalendarPeoplePanel } from "@/components/calendar/calendar-people-panel";
import { CalendarRoomsPanel } from "@/components/calendar/calendar-rooms-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw, Search } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { mapleMono } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { useCalendarSettings } from "@/hooks/use-calendar-settings";
import { getViewChipLabel } from "./calendar-toolbar-lib";
import {
  GOOGLE_EVENT_FALLBACK_COLOR,
  LOCAL_EVENT_FALLBACK_COLOR,
} from "./calendar-event-colors";


const CalendarAddDialog = dynamic(
  () =>
    import("@/components/calendar/calendar-add-dialog").then(
      (m) => m.CalendarAddDialog,
    ),
  { ssr: false },
);

const CalendarEventModal = dynamic(
  () =>
    import("@/components/calendar/calendar-event-modal").then(
      (m) => m.CalendarEventModal,
    ),
  { ssr: false },
);

export function CalendarDashboard() {
  const { settings } = useCalendarSettings();
  const [events, setEvents] = React.useState<CalendarEvent<CustomEventData>[]>(
    [],
  );
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [selectedSlotRange, setSelectedSlotRange] = React.useState<{
    date: Date;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] =
    React.useState<CalendarEvent<CustomEventData> | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  // null until the first response: no connection row before we know.
  const [googleConnected, setGoogleConnected] = React.useState<
    boolean | null
  >(null);
  // The error toast's Retry reads the latest sync through this ref.
  const syncCalendarRef = React.useRef<(showSpinner?: boolean) => void>(
    () => {},
  );

  // Below lg the panels sit under the calendar, so start them collapsed.
  const [compact] = React.useState(
    () => window.matchMedia("(max-width: 1023px)").matches,
  );

  // Attendees (teammates & meeting rooms) selected for mutual availability check
  const [selectedAttendees, setSelectedAttendees] = React.useState<
    CalendarAttendeeItem[]
  >([]);

  const handleToggleAttendee = React.useCallback(
    (item: CalendarAttendeeItem) => {
      setSelectedAttendees((prev) => {
        const exists = prev.some((a) => a.id === item.id);
        if (exists) {
          return prev.filter((a) => a.id !== item.id);
        }
        return [...prev, item];
      });
    },
    [],
  );

  // Track visible date range from calendar view (week, month, day) for performance optimization
  const [dateRange, setDateRange] = React.useState<{
    start: Date;
    end: Date;
  } | null>(() => {
    try {
      return getViewDateRange(settings.defaultView, new Date(), {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weekStartsOn: settings.weekStartsOn,
        dayCount: 1,
        agendaDayCount: 30,
        fixedWeeks: true,
      }).visibleRange;
    } catch {
      return null;
    }
  });

  const [viewInfo, setViewInfo] = React.useState<{
    view: CalendarView;
    date: Date;
  }>(() => ({ view: settings.defaultView, date: new Date() }));

  const requestIdRef = React.useRef(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleRangeChange = React.useCallback(
    (info: EventCalendarRangeInfo) => {
      setViewInfo((prev) =>
        prev.view === info.view && prev.date.getTime() === info.date.getTime()
          ? prev
          : { view: info.view, date: info.date },
      );
      setDateRange((prev) => {
        if (
          prev &&
          prev.start.getTime() === info.range.start.getTime() &&
          prev.end.getTime() === info.range.end.getTime()
        ) {
          return prev;
        }
        return { start: info.range.start, end: info.range.end };
      });
    },
    [],
  );

  // Fetch calendar events and working schedule from /api/calendar and open slots from /api/slots/find
  const syncCalendar = React.useCallback(
    async (showSpinner = false) => {
      if (!dateRange) return;
      if (showSpinner) setIsRefreshing(true);

      const requestId = ++requestIdRef.current;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const activeUserId = session?.user?.id || "";
      const attendeeEmails = selectedAttendees
        .map((a) => a.email)
        .filter(Boolean);
      try {
        const calendarData = await apiClient.calendar.getEvents(
          {
            userId: activeUserId,
            attendeeEmails:
              attendeeEmails.length > 0 ? attendeeEmails : undefined,
            timeMin: dateRange.start.toISOString(),
            timeMax: dateRange.end.toISOString(),
          },
          { signal: abortController.signal },
        );

        // Discard stale responses so they cannot overwrite newer requests
        if (requestId !== requestIdRef.current) {
          return;
        }
        setGoogleConnected(calendarData.googleConnected ?? null);

        const calendarEvents: CalendarEvent<CustomEventData>[] = (
          calendarData.events || []
        ).map((ev) => {
          const seriesMatch = ev.description?.match(
            /<!--series:([a-zA-Z0-9_-]+)-->/,
          );
          const seriesId =
            ev.recurringEventId ||
            ev.seriesId ||
            (seriesMatch ? seriesMatch[1] : undefined);

          return {
            id: ev.id,
            title: ev.title,
            start: new Date(ev.start),
            end: new Date(ev.end),
            recurringEventId: seriesId,
            color:
              ev.color ||
              (ev.source === "google"
                ? GOOGLE_EVENT_FALLBACK_COLOR
                : LOCAL_EVENT_FALLBACK_COLOR),
            data: {
              category: ev.category || "shared",
              location:
                ev.location || (ev.meetingUrl ? "Google Meet" : undefined),
              description: ev.description || undefined,
              seriesId,
              meetingUrl: ev.meetingUrl || undefined,
              attendees: ev.attendees || [],
              status: ev.status,
              source: ev.source,
              organizer: ev.organizer,
              roomDetails: ev.roomDetails,
              projectId: ev.projectId,
              project: ev.project,
            },
          };
        });
        setEvents(calendarEvents);
      } catch (err) {
        // Aborted or superseded requests fail silently; a real failure keeps
        // the events already on screen and says so, with a way to retry.
        if (
          (err as Error)?.name === "AbortError" ||
          requestId !== requestIdRef.current
        ) {
          return;
        }
        console.error("Failed to sync calendar:", err);
        toast.error("Couldn't load calendar events", {
          id: "calendar-sync-error",
          action: {
            label: "Retry",
            onClick: () => syncCalendarRef.current(true),
          },
        });
      } finally {
        if (requestId === requestIdRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [session?.user?.id, selectedAttendees, dateRange],
  );

  React.useEffect(() => {
    syncCalendarRef.current = (showSpinner) => void syncCalendar(showSpinner);
    queueMicrotask(() => {
      void syncCalendar(false);
    });
  }, [syncCalendar]);

  // ⌘K is a decorative hint; focus the header search when pressed.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter events by search query
  const displayedEvents = React.useMemo(() => {
    return events.filter((ev) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ev.title.toLowerCase().includes(q) ||
          ev.data?.location?.toLowerCase().includes(q) ||
          ev.data?.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, searchQuery]);

  const handleAddEvent = (newEvent: CalendarEvent<CustomEventData>) => {
    setEvents((prev) => {
      if (prev.some((e) => e.id === newEvent.id)) return prev;
      return [...prev, newEvent];
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSelectSlot = React.useCallback(
    (draft: EventCalendarSlotDraft) => {
      setSelectedSlotRange({
        date: draft.start,
        startTime: format(draft.start, "HH:mm"),
        endTime: format(draft.end, "HH:mm"),
      });
      setIsAddOpen(true);
    },
    [],
  );

  const handleSlotClick = React.useCallback((slot: EventCalendarSlotInfo) => {
    const start = slot.date;
    const end = slot.end || addMinutes(start, 30);
    setSelectedSlotRange({
      date: start,
      startTime: format(start, "HH:mm"),
      endTime: format(end, "HH:mm"),
    });
    setIsAddOpen(true);
  }, []);

  const handleEventUpdate = React.useCallback(
    (update: EventCalendarProposedUpdate<CustomEventData>) => {
      const eventId = update.event.id;
      const newStartIso = update.start.toISOString();
      const newEndIso = update.end.toISOString();

      const promise = apiClient.bookings.reschedule(eventId, {
        startTime: newStartIso,
        endTime: newEndIso,
      });

      toast.promise(promise, {
        loading: `Rescheduling "${update.event.title}"...`,
        success: () => {
          syncCalendar(false);
          return `Rescheduled "${update.event.title}" to ${format(update.start, "EEE, MMM d, h:mm a")}`;
        },
        error: (err) => {
          syncCalendar(true);
          return err instanceof Error
            ? err.message
            : "Failed to reschedule event";
        },
      });

      return true;
    },
    [syncCalendar],
  );

  const weekChipLabel = getViewChipLabel(viewInfo.view, viewInfo.date);
  const timePattern = settings.timeFormat === "24h" ? "HH:mm" : "h a";

  const openAddEvent = (): void => {
    setSelectedSlotRange(null);
    setIsAddOpen(true);
  };

  return (
    <div
      className={cn(
        mapleMono.variable,
        "flex w-full flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:h-full lg:min-h-0",
      )}
    >
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
            {weekChipLabel && (
              <span className="hidden rounded-[4px] border px-1.5 py-px font-code text-[11px] tabular-nums text-muted-foreground md:inline-block">
                {weekChipLabel}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Plan meetings across your team and rooms.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-52 sm:flex-none">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search events"
              aria-label="Search events"
              className="h-8 pl-8 text-xs sm:pr-12"
            />
            <kbd
              aria-hidden
              className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-[4px] border px-1 font-code sm:block text-[10px] leading-4 text-muted-foreground"
            >
              ⌘K
            </kbd>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => syncCalendar(true)}
            aria-label="Refresh calendar"
          >
            <RefreshCw className={isRefreshing ? "animate-spin" : undefined} />
          </Button>
          <Button
            onClick={openAddEvent}
            className="shrink-0 gap-1.5 max-sm:w-8 max-sm:px-0"
          >
            <Plus />
            <span className="sr-only sm:not-sr-only">Add event</span>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[260px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="order-last flex min-w-0 flex-col divide-y self-start overflow-hidden rounded-lg border bg-card lg:order-none lg:max-h-full lg:overflow-y-auto">
          <CalendarTeamPanel
            selectedAttendees={selectedAttendees}
            onToggleAttendee={handleToggleAttendee}
            currentUserEmail={session?.user?.email}
            defaultOpen={!compact}
          />
          <CalendarPeoplePanel
            selectedAttendees={selectedAttendees}
            onToggleAttendee={handleToggleAttendee}
            currentUserEmail={session?.user?.email}
          />
          <CalendarRoomsPanel
            selectedAttendees={selectedAttendees}
            onToggleAttendee={handleToggleAttendee}
            defaultOpen={!compact}
          />
        </div>

        {/* Sized to its content, capped by the space left: the card ends under
            the last hour row and the grid scrolls inside once it is taller. A
            grid (not flex) container lets the 1fr row clamp to max-height, so
            the time grid's own scroller gets a definite height. Month view is
            a fill-the-space layout, so it takes the whole cap. */}
        <div
          className={`order-first grid max-h-[max(480px,calc(100svh-10rem))] min-w-0 grid-rows-[minmax(0,1fr)] self-start overflow-hidden rounded-lg border bg-card lg:order-none lg:max-h-full ${
            viewInfo.view === "month"
              ? "h-[max(480px,calc(100svh-10rem))] lg:h-full"
              : ""
          }`}
        >
          <EventCalendar<CustomEventData>
            key={`cal-${settings.defaultView}-${settings.weekStartsOn}-${settings.dayStartHour}-${settings.dayEndHour}-${settings.showWeekends}-${settings.slotDuration}-${settings.timeFormat}-${settings.showNowIndicator}`}
            events={displayedEvents}
            onEventsChange={setEvents}
            onRangeChange={handleRangeChange}
            defaultView={settings.defaultView}
            defaultDate={new Date()}
            views={["week", "month", "day", "agenda"]}
            dayStartHour={settings.dayStartHour}
            dayEndHour={settings.dayEndHour}
            weekStartsOn={settings.weekStartsOn}
            slotDuration={settings.slotDuration}
            i18n={
              settings.timeFormat === "24h"
                ? {
                    formats: {
                      timeGutter: "HH:mm",
                      timeGutterMinute: "HH:mm",
                      eventTime: "HH:mm",
                    },
                  }
                : undefined
            }
            viewSettings={{
              weekends: settings.showWeekends,
              nowIndicator: settings.showNowIndicator,
            }}
            // Today keeps the plain background; its header cell carries a 2px
            // ember top rule (inset, so the header row does not shift).
            todayClassName="bg-transparent border-b-0 data-[slot=event-calendar-day-header]:shadow-[inset_0_2px_0_0_var(--color-primary)]"
            onSelectSlot={handleSelectSlot}
            onSlotClick={handleSlotClick}
            onEventUpdate={handleEventUpdate}
            className="flex h-full min-h-0 flex-col"
            classNames={{
              timeGrid: "border-border/70",
              timeGridHeader: "border-border/70",
              timeGutter: "w-18 border-border/70",
              dayColumn: "border-border/70",
              allDaySection: "border-border/70",
              allDayLabel: "text-[11px]",
              timeGutterLabel:
                "font-code text-[11px] tabular-nums text-muted-foreground",
              event: "rounded-md border transition-colors",
              // Date number pinned top-left, on the weekday headers' edge.
              monthCellFooter: "order-first justify-start px-1.5 pt-1.5 pb-0",
              monthCellContent: "pt-1",
              // Near-black on ember passes AA in both themes; white does not.
              monthDayNumber:
                "font-code text-xs tabular-nums group-data-today/ec-cell:font-semibold group-data-today/ec-cell:text-foreground dark:group-data-today/ec-cell:text-primary-foreground",
              noEvents: "min-h-0 items-start justify-start px-4 py-6",
            }}
            renderNoEvents={() => (
              <p className="text-sm text-muted-foreground">
                Nothing scheduled in this range.{" "}
                <button
                  type="button"
                  onClick={openAddEvent}
                  className="font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:underline"
                >
                  Add event
                </button>
              </p>
            )}
            // The default gutter skips the day-start label (it would clip at
            // the grid's top edge); this one sits just inside that edge.
            renderTimeGutterSlot={({ time, hour, minute }) =>
              hour === settings.dayStartHour && minute === 0 ? (
                <span className="relative top-2">
                  {format(time, timePattern)}
                </span>
              ) : undefined
            }
            // Solid hairlines mark the hours (the grid's own slot lines);
            // dashed rules mark the half-hours, echoing the landing's rails.
            renderDayColumnBackground={({ boundsStartMin, boundsEndMin }) => {
              const marks: number[] = [];
              for (
                let m = Math.floor(boundsStartMin / 60) * 60 + 30;
                m < boundsEndMin;
                m += 60
              ) {
                if (m > boundsStartMin) marks.push(m);
              }
              return marks.map((m) => (
                <div
                  key={m}
                  aria-hidden
                  className="absolute inset-x-0 border-t border-dashed border-border/70"
                  style={{
                    top: `calc(var(--ec-hour-height) * ${(m - boundsStartMin) / 60})`,
                  }}
                />
              ));
            }}
            onEventClick={(occurrence) => {
              setSelectedEvent(occurrence.event);
              setIsDetailOpen(true);
            }}
            renderDayHeader={({ day, view, isToday }) => {
              const dayName = format(day, "EEE");
              const dayNumber = format(day, "d");

              // Month columns are weekdays, not dates: each cell carries its
              // own number, so the header names the weekday only.
              if (view === "month") {
                return (
                  <div className="flex items-center py-2.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {dayName}
                    </span>
                  </div>
                );
              }

              return (
                <div className="flex items-center justify-center gap-1.5 py-2.5">
                  <span
                    className={`text-xs ${isToday ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}
                  >
                    {dayName}
                  </span>
                  {isToday ? (
                    // Near-black on ember passes AA in both themes; white does not.
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold tabular-nums text-foreground dark:text-primary-foreground">
                      {dayNumber}
                    </span>
                  ) : (
                    <span className="text-xs font-medium tabular-nums text-foreground">
                      {dayNumber}
                    </span>
                  )}
                </div>
              );
            }}
            renderNowIndicator={
              settings.showNowIndicator
                ? ({ time }) => (
                    <div className="relative flex w-full items-center">
                      <div className="w-18 shrink-0 pr-2 text-right">
                        <span className="rounded-[4px] bg-card px-1 font-code text-[11px] font-medium tabular-nums text-foreground">
                          {format(
                            time,
                            settings.timeFormat === "24h" ? "HH:mm" : "h:mm a",
                          )}
                        </span>
                      </div>
                      <span
                        aria-hidden
                        className="-ml-1 size-2 shrink-0 rounded-full bg-primary"
                      />
                      <div className="h-0.5 flex-1 bg-primary" />
                    </div>
                  )
                : () => null
            }
            renderEvent={({ occurrence, segment, view }) => {
              const { event } = occurrence;
              const timePattern =
                settings.timeFormat === "24h" ? "HH:mm" : "h:mm a";
              const startTime = format(occurrence.start, timePattern);
              const endTime = format(occurrence.end, timePattern);
              const timeRange = `${startTime} – ${endTime}`;

              const durationMinutes =
                (occurrence.end.getTime() - occurrence.start.getTime()) /
                (1000 * 60);
              const segmentMinutes =
                segment &&
                segment.startMin !== undefined &&
                segment.endMin !== undefined
                  ? segment.endMin - segment.startMin
                  : durationMinutes;
              const isShort = durationMinutes <= 30 || segmentMinutes <= 30;
              const isMedium = segmentMinutes <= 45;

              const hasDot = event.data?.hasDot;
              const dotColor = event.data?.dotColor || event.color;

              if (isShort || view === "month") {
                return (
                  <div className="flex w-full select-none items-center gap-1 overflow-hidden text-xs leading-none">
                    {hasDot && (
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                    )}
                    <span className="min-w-0 truncate font-semibold">
                      {event.title}
                      <span className="ml-1 text-[11px] font-normal opacity-85">
                        , {timeRange}
                      </span>
                    </span>
                  </div>
                );
              }

              return (
                <div className="flex h-full w-full select-none flex-col justify-start gap-0.5 overflow-hidden text-xs">
                  <div className="flex min-w-0 items-start justify-between gap-1">
                    <span
                      className={`${isMedium ? "line-clamp-1" : "line-clamp-2"} min-w-0 font-semibold leading-tight tracking-tight`}
                    >
                      {event.title}
                    </span>
                    {hasDot && (
                      <span
                        className="mt-0.5 size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                    )}
                  </div>
                  <span className="truncate whitespace-nowrap text-[11px] font-normal leading-tight opacity-85">
                    {timeRange}
                  </span>
                </div>
              );
            }}
          >
            <CalendarToolbar weekStartsOn={settings.weekStartsOn} />
            <CalendarMobileDayLock />
            {googleConnected === false && (
              <div className="flex shrink-0 items-center gap-3 border-b px-3 py-1.5 text-xs">
                <span className="flex shrink-0 items-center gap-1.5 font-code text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-muted-foreground/40"
                  />
                  Google Calendar · not connected
                </span>
                <span className="hidden min-w-0 truncate text-muted-foreground md:inline">
                  Link it to see your Google events here.
                </span>
                <Link
                  href="/account/settings"
                  className="ml-auto shrink-0 font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:underline"
                >
                  Connect
                </Link>
              </div>
            )}
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <EventCalendarContent className="flex-1" />
            </div>
          </EventCalendar>
        </div>
      </div>

      {/* Add Event Dialog */}
      <CalendarAddDialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setSelectedSlotRange(null);
        }}
        selectedDate={selectedSlotRange?.date || new Date()}
        initialStartTime={selectedSlotRange?.startTime}
        initialEndTime={selectedSlotRange?.endTime}
        onAddEvent={handleAddEvent}
        onCreated={() => syncCalendar(true)}
      />

      {/* Event Details Modal */}
      <CalendarEventModal
        event={selectedEvent}
        allEvents={events}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onDeleteEvent={handleDeleteEvent}
        onDeleteSeries={(seriesId, eventId, _eventTitle) => {
          setEvents((prev) =>
            prev.filter((e) => {
              if (e.id === eventId) return false;
              if (
                seriesId &&
                (e.recurringEventId === seriesId ||
                  e.data?.seriesId === seriesId)
              ) {
                return false;
              }
              if (
                seriesId &&
                e.data?.description?.includes(`<!--series:${seriesId}-->`)
              ) {
                return false;
              }
              return true;
            }),
          );
          void syncCalendar(false);
        }}
      />
    </div>
  );
}
