"use client";

import { Clock, DoorOpen } from "lucide-react";
import React, { useEffect, useState } from "react";
import { McpHeaderControls } from "@/components/mcp-ui/mcp-header-controls";
import {
  type BusyInterval,
  extractData,
  fmtTime,
  formatNames,
  getAttendeeNames,
  getParticipantColumns,
  type ScheduleData,
  type ScheduleRoom,
  type ScheduleSlot,
} from "@/components/mcp-ui/mcp-ui-types";
import {
  expandTo15MinSlots,
  getIctMinutes,
  getRoomBusyIntervals,
  isIntervalBusy,
  isRoomBusyAt,
  mergeFreeWindows,
  pickRecommendedRoom,
} from "@/components/mcp-ui/schedule-helpers";
import { ScheduleTimeline } from "@/components/mcp-ui/schedule-timeline";
import { useMcpBridge } from "@/components/mcp-ui/use-mcp-bridge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180] as const;
const fmtDur = (d: number) => (d >= 60 && d % 60 === 0 ? `${d / 60}h (${d}m)` : `${d} min`);

export function ScheduleApp({ initialData = null }: { initialData?: unknown }): React.JSX.Element {
  const { data, setData, callTool, askAi } = useMcpBridge<ScheduleData>(initialData);
  const [todFilter, setTodFilter] = useState<"all" | "am" | "pm">("all");
  const [customDuration, setCustomDuration] = useState<number | null>(null);
  const [roomId, setRoomId] = useState("");
  const [hasUserChangedRoom, setHasUserChangedRoom] = useState(false);
  const [roomFreeMsSet, setRoomFreeMsSet] = useState<Set<number> | null>(null);
  const [roomsList, setRoomsList] = useState<readonly ScheduleRoom[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [bookedIntervals, setBookedIntervals] = useState<readonly BusyInterval[]>([]);
  const [titleInput, setTitleInput] = useState("");
  const [agendaInput, setAgendaInput] = useState("");
  const [status, setStatus] = useState<{ text: string; tone: "green" | "amber" | "red" } | null>(
    null
  );
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const rooms = roomsList.length > 0 ? roomsList : data?.rooms || [];
  const participants = getParticipantColumns(data);
  const names = getAttendeeNames(data);
  const durationMin = customDuration ?? data?.durationMinutes ?? 30;
  const durationChoices = DURATION_OPTIONS.includes(
    durationMin as (typeof DURATION_OPTIONS)[number]
  )
    ? DURATION_OPTIONS
    : [...DURATION_OPTIONS, durationMin].sort((a, b) => a - b);
  const defaultTitle =
    data?.suggestedTitle || (names.length > 0 ? `Sync: ${formatNames(names)}` : "Meeting");
  const allPeopleBusy = participants.flatMap((p) => p.busy ?? []);
  const allSlots = expandTo15MinSlots(data?.mutualSlots || [], durationMin, allPeopleBusy);
  const recommendedRoom = pickRecommendedRoom(rooms, participants.length, allSlots);
  const effectiveRoomId = hasUserChangedRoom
    ? roomId
    : roomId || data?.selectedRoomId || recommendedRoom?.id || "";
  const selectedRoom =
    rooms.find((r) => String(r.id) === String(effectiveRoomId) || r.email === effectiveRoomId) ||
    null;
  const roomBusyList = getRoomBusyIntervals(selectedRoom, roomFreeMsSet, allSlots);
  const attendeeEmails = participants.map((p) => p.email).filter((e): e is string => Boolean(e));

  useEffect(() => {
    if (!data || (data.rooms && data.rooms.length > 0)) return;
    callTool<{ content?: { text?: string }[] }>("list_meeting_rooms", {})
      .then((res) => {
        const txt = res?.content?.[0]?.text;
        if (txt) setRoomsList(JSON.parse(txt) as ScheduleRoom[]);
      })
      .catch(() => {});
  }, [data, callTool]);

  async function refreshSlots(nextDuration: number, prevStart?: string): Promise<void> {
    if (!data) return;
    setIsSyncing(true);
    try {
      const res = await callTool("find_common_meeting_slots", {
        attendees: attendeeEmails,
        durationMinutes: nextDuration,
        startDate: data.dateStr,
        endDate: data.dateStr,
      });
      const updated = extractData<ScheduleData>(res);
      if (updated) {
        setData((prev) => ({ ...prev, ...updated, durationMinutes: nextDuration }));
        if (updated.rooms) setRoomsList(updated.rooms);
      }
      if (prevStart) {
        const nextEnd = new Date(
          new Date(prevStart).getTime() + nextDuration * 60_000
        ).toISOString();
        if (
          !isIntervalBusy(allPeopleBusy, prevStart, nextEnd) &&
          !isIntervalBusy(bookedIntervals, prevStart, nextEnd) &&
          !isRoomBusyAt(selectedRoom, null, prevStart, nextEnd)
        ) {
          setSelectedSlot({ start: prevStart, end: nextEnd });
        }
      }
      setStatus(null);
    } catch {
      /* ignore */
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSelectRoom(val: string): Promise<void> {
    const roomVal = val === "__none__" ? "" : val;
    setHasUserChangedRoom(true);
    setRoomId(roomVal);
    setRoomFreeMsSet(null);
    setBookingError(null);
    const room = rooms.find((r) => String(r.id) === String(roomVal) || r.email === roomVal) || null;
    let nextFreeSet: Set<number> | null = null;
    if (room && !Array.isArray(room.busy) && data?.currentUser) {
      setStatus({ text: `Checking ${room.name}...`, tone: "amber" });
      try {
        const res = await callTool("find_common_meeting_slots", {
          attendees: Array.from(new Set([...attendeeEmails, room.email])),
          durationMinutes: durationMin,
          startDate: data.dateStr,
          endDate: data.dateStr,
        });
        const sc = extractData<ScheduleData>(res);
        if (sc?.rooms) setRoomsList(sc.rooms);
        if (sc?.mutualSlots) {
          const expanded = expandTo15MinSlots(sc.mutualSlots, durationMin, allPeopleBusy);
          nextFreeSet = new Set(expanded.map((s) => new Date(s.start).getTime()));
          setRoomFreeMsSet(nextFreeSet);
        }
      } catch {
        /* fallback to room.busy */
      }
    }
    if (
      room &&
      selectedSlot &&
      isRoomBusyAt(room, nextFreeSet, selectedSlot.start, selectedSlot.end)
    ) {
      setSelectedSlot(null);
    }
    if (room) {
      const freeCount = allSlots.filter(
        (s) => !isRoomBusyAt(room, nextFreeSet, s.start, s.end)
      ).length;
      setStatus({
        text: `${room.name}: ${freeCount}/${allSlots.length} slots free`,
        tone: freeCount > 0 ? "green" : "amber",
      });
    } else {
      setStatus(null);
    }
  }

  async function handleBookNow(): Promise<void> {
    if (!selectedSlot || !data) return;
    setIsBooking(true);
    setBookingError(null);
    const lbl = `${fmtTime(selectedSlot.start)} – ${fmtTime(selectedSlot.end)}`;
    setStatus({ text: `Booking ${lbl}...`, tone: "amber" });
    try {
      await callTool("book_meeting", {
        summary: (titleInput || defaultTitle).trim(),
        description: agendaInput.trim() || undefined,
        start: selectedSlot.start,
        end: selectedSlot.end,
        attendees: attendeeEmails.filter((e) => e.includes("@")),
        roomEmail: selectedRoom?.email || undefined,
        roomId: selectedRoom?.id || undefined,
      });
      const booked = { start: selectedSlot.start, end: selectedSlot.end };
      setBookedIntervals((prev) => [...prev, booked]);
      if (selectedRoom) {
        setRoomsList((prev) =>
          (prev.length > 0 ? prev : rooms).map((r) =>
            r.id === selectedRoom.id ? { ...r, busy: [...(r.busy ?? []), booked] } : r
          )
        );
      }
      setStatus({
        text: `Booked ${lbl}${selectedRoom ? ` in ${selectedRoom.name}` : ""}`,
        tone: "green",
      });
      setSelectedSlot(null);
    } catch (err) {
      setStatus({ text: "Direct booking failed — click Ask AI", tone: "red" });
      setBookingError(`Booking error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsBooking(false);
    }
  }

  function handleAskAi(): void {
    if (!selectedSlot) return;
    const summary = (titleInput || defaultTitle).trim();
    const otherNames = names.filter((n) => n !== data?.currentUser?.name);
    let prompt = `Please book "${summary}" with ${otherNames.length ? formatNames(otherNames) : "attendees"} from ${selectedSlot.start} to ${selectedSlot.end}`;
    if (selectedRoom) prompt += ` in room "${selectedRoom.name}" (${selectedRoom.email})`;
    if (agendaInput.trim()) prompt += `. Agenda / additional instructions: ${agendaInput.trim()}`;
    askAi(prompt);
    setStatus({ text: "Sent to AI (copied)", tone: "green" });
  }

  if (!data) {
    return (
      <Card className="border-border bg-card text-card-foreground mx-auto max-w-3xl">
        <CardContent className="text-muted-foreground py-8 text-center">
          Loading availability timeline...
        </CardContent>
      </Card>
    );
  }

  const filteredSlots = allSlots.filter((s) =>
    todFilter === "all"
      ? true
      : todFilter === "am"
        ? Math.floor(getIctMinutes(s.start) / 60) < 12
        : Math.floor(getIctMinutes(s.start) / 60) >= 12
  );
  const openSlots = filteredSlots.filter(
    (s) =>
      !s.booked &&
      !isIntervalBusy(allPeopleBusy, s.start, s.end) &&
      !isIntervalBusy(bookedIntervals, s.start, s.end) &&
      !isRoomBusyAt(selectedRoom, roomFreeMsSet, s.start, s.end)
  );
  const dotClass =
    status?.tone === "amber"
      ? "bg-amber-500"
      : status?.tone === "red"
        ? "bg-destructive"
        : "bg-emerald-500";
  const fmtRoom = (r: ScheduleRoom, rec?: boolean) =>
    `Room: ${r.name} (${r.capacity || 0}p${r.officeLocation ? ` · ${r.officeLocation.toUpperCase()}` : ""})${rec ? " · Recommended" : ""}`;

  return (
    <Card className="border-border bg-card text-card-foreground mx-auto max-w-3xl shadow-sm">
      <CardHeader className="border-border/60 border-b">
        <CardTitle>{formatNames(names)}</CardTitle>
        <CardDescription>
          {data.dateStr ? `${data.dateStr} · ${durationMin} min slots · ICT (UTC+7)` : ""}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-1.5">
            {status && (
              <Badge variant="outline" className="gap-1.5">
                <span className={`size-2 rounded-full ${dotClass}`} />
                {status.text}
              </Badge>
            )}
            <McpHeaderControls
              isSyncing={isSyncing}
              onSync={() => void refreshSlots(durationMin, selectedSlot?.start)}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3.5 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {(["all", "am", "pm"] as const).map((k) => (
              <Button
                key={k}
                size="xs"
                variant={todFilter === k ? "default" : "outline"}
                onClick={() => setTodFilter(k)}
              >
                {k === "all" ? `All (${allSlots.length})` : k === "am" ? "Morning" : "Afternoon"}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Select
              value={String(durationMin)}
              onValueChange={(v) => {
                if (!v) return;
                const nextDur = Number(v);
                const prevStart = selectedSlot?.start;
                setSelectedSlot(null);
                setCustomDuration(nextDur);
                setRoomFreeMsSet(null);
                setStatus({ text: `Loading ${nextDur} min slots...`, tone: "amber" });
                void refreshSlots(nextDur, prevStart);
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="Meeting duration"
                className="text-xs font-medium"
              >
                <Clock className="text-muted-foreground size-3.5" />
                <SelectValue>{fmtDur(durationMin)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {durationChoices.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {fmtDur(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={effectiveRoomId || "__none__"}
              onValueChange={(v) => v && void handleSelectRoom(String(v))}
            >
              <SelectTrigger
                size="sm"
                aria-label="Filter availability & attach meeting room"
                className="text-xs font-medium"
              >
                <DoorOpen className="text-muted-foreground size-3.5" />
                <SelectValue>
                  {selectedRoom ? fmtRoom(selectedRoom) : "No room (Google Meet)"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No room (Google Meet)</SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {fmtRoom(r, recommendedRoom?.id === r.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScheduleTimeline
          participants={participants}
          selectedRoom={selectedRoom}
          roomBusyList={roomBusyList}
          sharedFreeBands={mergeFreeWindows(openSlots)}
          bookedIntervals={bookedIntervals}
          openSlots={openSlots}
          allSlots={allSlots}
          selectedSlot={selectedSlot}
          isSyncing={isSyncing}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            if (!titleInput) setTitleInput(defaultTitle);
            if (!agendaInput && data?.suggestedAgenda) setAgendaInput(data.suggestedAgenda);
            setBookingError(null);
          }}
        />

        {selectedSlot && !isSyncing && (
          <div className="border-border bg-muted/30 space-y-2.5 rounded-xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold">
                Slot: {fmtTime(selectedSlot.start)} – {fmtTime(selectedSlot.end)}
              </span>
              <Badge variant="secondary">
                {selectedRoom
                  ? `Room: ${selectedRoom.name} (${selectedRoom.capacity || 0}p)`
                  : "Google Meet (Online)"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="mtg-title" className="text-xs">
                  Meeting Title
                </Label>
                <Input
                  id="mtg-title"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Product Sync"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mtg-agenda" className="text-xs">
                  Agenda / Extra Instructions for AI
                </Label>
                <Textarea
                  id="mtg-agenda"
                  rows={2}
                  value={agendaInput}
                  onChange={(e) => setAgendaInput(e.target.value)}
                  placeholder="e.g. Review milestones..."
                />
              </div>
            </div>
            {bookingError && <div className="text-destructive text-xs">{bookingError}</div>}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={handleAskAi}>
                Ask AI with Prompt
              </Button>
              <Button size="sm" disabled={isBooking} onClick={() => void handleBookNow()}>
                {isBooking ? "Booking..." : "Book Now"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
