"use client";

import * as React from "react";
import { format, addMinutes } from "date-fns";
import { toast } from "sonner";
import { EventCalendar } from "@/components/reui/event-calendar/event-calendar";
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content";
import { getViewDateRange } from "@/components/reui/event-calendar/event-calendar-lib";
import type {
  CalendarEvent,
  EventCalendarRangeInfo,
  EventCalendarProposedUpdate,
  EventCalendarSlotDraft,
  EventCalendarSlotInfo,
} from "@/components/reui/event-calendar/event-calendar-types";
import { type CustomEventData } from "@/mock-data/calendar-events";
import {
  UntitledCalendarNav,
  type CalendarTabFilter,
} from "@/components/calendar/untitled-calendar-nav";
import type { CalendarAttendeeItem } from "@/components/calendar/calendar-attendee-stack";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { useCalendarSettings } from "@/hooks/use-calendar-settings";

const CalendarAddDialog = dynamic(
  () => import("@/components/calendar/calendar-add-dialog").then((m) => m.CalendarAddDialog),
  { ssr: false }
);

const CalendarEventModal = dynamic(
  () => import("@/components/calendar/calendar-event-modal").then((m) => m.CalendarEventModal),
  { ssr: false }
);

export function CalendarDashboard() {
  const { settings } = useCalendarSettings();
  const [events, setEvents] = React.useState<CalendarEvent<CustomEventData>[]>([]);
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = React.useState<CalendarTabFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [selectedSlotRange, setSelectedSlotRange] = React.useState<{
    date: Date;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent<CustomEventData> | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Attendees (teammates & meeting rooms) selected for mutual availability check
  const [selectedAttendees, setSelectedAttendees] = React.useState<CalendarAttendeeItem[]>([]);
  const [isCalculatingSlots, setIsCalculatingSlots] = React.useState(false);

  const handleToggleAttendee = React.useCallback((item: CalendarAttendeeItem) => {
    setSelectedAttendees((prev) => {
      const exists = prev.some((a) => a.id === item.id);
      if (exists) {
        return prev.filter((a) => a.id !== item.id);
      }
      return [...prev, item];
    });
  }, []);

  const handleRemoveAttendee = React.useCallback((id: string) => {
    setSelectedAttendees((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleClearAllAttendees = React.useCallback(() => {
    setSelectedAttendees([]);
  }, []);

  // Track visible date range from calendar view (week, month, day) for performance optimization
  const [dateRange, setDateRange] = React.useState<{ start: Date; end: Date } | null>(() => {
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

  const requestIdRef = React.useRef(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleRangeChange = React.useCallback((info: EventCalendarRangeInfo) => {
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
  }, []);

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
      const attendeeEmails = selectedAttendees.map((a) => a.email).filter(Boolean);
      if (attendeeEmails.length > 0) {
        setIsCalculatingSlots(true);
      }
      try {
        const calendarData = await apiClient.calendar
          .getEvents(
            {
              userId: activeUserId,
              attendeeEmails: attendeeEmails.length > 0 ? attendeeEmails : undefined,
              timeMin: dateRange.start.toISOString(),
              timeMax: dateRange.end.toISOString(),
            },
            { signal: abortController.signal }
          )
          .catch((err) => {
            if (err?.name === "AbortError") return null;
            return {
              events: [],
              workingHours: [],
              timeZone: "Asia/Ho_Chi_Minh",
              googleConnected: false,
            };
          });

        // Discard stale or aborted responses so they cannot overwrite newer requests
        if (!calendarData || requestId !== requestIdRef.current) {
          return;
        }

        const calendarEvents: CalendarEvent<CustomEventData>[] = (calendarData.events || []).map(
          (ev) => ({
            id: ev.id,
            title: ev.title,
            start: new Date(ev.start),
            end: new Date(ev.end),
            color: ev.color || (ev.source === "google" ? "#0284c7" : "#ea580c"),
            data: {
              category: ev.category || "shared",
              location: ev.location || (ev.meetingUrl ? "Google Meet" : undefined),
              description: ev.description || undefined,
              meetingUrl: ev.meetingUrl || undefined,
              attendees: ev.attendees || [],
              status: ev.status,
              source: ev.source,
              organizer: ev.organizer,
              roomDetails: ev.roomDetails,
              projectId: ev.projectId,
              project: ev.project,
            },
          })
        );
        setEvents(calendarEvents);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.error("Failed to sync calendar:", err);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsRefreshing(false);
          setIsCalculatingSlots(false);
        }
      }
    },
    [session?.user?.id, selectedAttendees, dateRange]
  );

  React.useEffect(() => {
    queueMicrotask(() => {
      void syncCalendar(false);
    });
  }, [syncCalendar]);

  // Filter events by tab & search query
  const displayedEvents = React.useMemo(() => {
    return events.filter((ev) => {
      if (activeTab !== "all" && ev.data?.category !== activeTab) {
        return false;
      }
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
  }, [events, activeTab, searchQuery]);

  const handleAddEvent = (newEvent: CalendarEvent<CustomEventData>) => {
    setEvents((prev) => {
      if (prev.some((e) => e.id === newEvent.id)) return prev;
      return [...prev, newEvent];
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSelectSlot = React.useCallback((draft: EventCalendarSlotDraft) => {
    setSelectedSlotRange({
      date: draft.start,
      startTime: format(draft.start, "HH:mm"),
      endTime: format(draft.end, "HH:mm"),
    });
    setIsAddOpen(true);
  }, []);

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
          return err instanceof Error ? err.message : "Failed to reschedule event";
        },
      });

      return true;
    },
    [syncCalendar]
  );

  return (
    <div className="flex h-full min-h-[calc(100svh-57px)] w-full flex-col bg-white dark:bg-neutral-900">
      <EventCalendar<CustomEventData>
        key={`cal-${settings.defaultView}-${settings.weekStartsOn}-${settings.dayStartHour}-${settings.dayEndHour}-${settings.showWeekends}-${settings.slotDuration}`}
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
        viewSettings={{
          weekends: settings.showWeekends,
          nowIndicator: settings.showNowIndicator,
        }}
        onSelectSlot={handleSelectSlot}
        onSlotClick={handleSlotClick}
        onEventUpdate={handleEventUpdate}
        className="flex h-full flex-1 flex-col"
        classNames={{
          timeGrid: "border-neutral-200/80 dark:border-neutral-800",
          timeGutter: "w-18",
          dayColumn: "border-neutral-100 dark:border-neutral-800/80",
          event: "rounded-lg border shadow-2xs hover:shadow-xs transition-all",
        }}
        onEventClick={(occurrence) => {
          setSelectedEvent(occurrence.event);
          setIsDetailOpen(true);
        }}
        renderDayHeader={({ day, isToday }) => {
          const isHighlighted = isToday;
          const dayName = format(day, "EEE") === "Thu" ? "Thur" : format(day, "EEE");
          const dayNumber = format(day, "d");

          return (
            <div className="flex items-center justify-center py-2.5">
              <span
                className={`text-xs ${isHighlighted ? "font-semibold text-orange-600 dark:text-orange-400" : "font-medium text-neutral-600 dark:text-neutral-400"}`}
              >
                {dayName}
              </span>
              {isHighlighted ? (
                <span className="shadow-2xs ml-1.5 flex size-6 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white ring-2 ring-orange-500/20">
                  {dayNumber}
                </span>
              ) : (
                <span className="ml-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200">
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
                  <div className="w-18 shrink-0 pr-2.5 text-right">
                    <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                      {format(time, settings.timeFormat === "24h" ? "HH:mm" : "h:mm a")} •
                    </span>
                  </div>
                  <div className="flex-1 border-b-2 border-orange-500/70 dark:border-orange-500/60" />
                </div>
              )
            : () => null
        }
        renderEvent={({ occurrence, segment, view }) => {
          const { event } = occurrence;
          const timePattern = settings.timeFormat === "24h" ? "HH:mm" : "h:mm a";
          const startTime = format(occurrence.start, timePattern);
          const endTime = format(occurrence.end, timePattern);
          const timeRange = `${startTime} – ${endTime}`;

          const durationMinutes =
            (occurrence.end.getTime() - occurrence.start.getTime()) / (1000 * 60);
          const segmentMinutes =
            segment && segment.startMin !== undefined && segment.endMin !== undefined
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
                  <span className="ml-1 text-[11px] font-normal opacity-85">, {timeRange}</span>
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
        <UntitledCalendarNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          weekStartsOn={settings.weekStartsOn}
          onOpenAddEvent={() => {
            setSelectedSlotRange(null);
            setIsAddOpen(true);
          }}
          onRefresh={() => syncCalendar(true)}
          isRefreshing={isRefreshing}
          currentUser={session?.user}
          selectedAttendees={selectedAttendees}
          onToggleAttendee={handleToggleAttendee}
          onRemoveAttendee={handleRemoveAttendee}
          onClearAllAttendees={handleClearAllAttendees}
          isCalculatingSlots={isCalculatingSlots}
        />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <EventCalendarContent className="flex-1" />
        </div>
      </EventCalendar>

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
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onDeleteEvent={handleDeleteEvent}
      />
    </div>
  );
}
