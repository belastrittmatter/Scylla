import {
  type BusyInterval,
  fmtTime,
  type ScheduleRoom,
  type ScheduleSlot,
} from "@/components/mcp-ui/mcp-ui-types";

export const WORKDAY_START_MIN = 8 * 60; // 08:00
export const WORKDAY_END_MIN = 18 * 60; // 18:00
export const STEP_15_MS = 15 * 60 * 1000;
export const TIMELINE_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const;

export function getIctMinutes(iso?: string): number {
  if (!iso || !iso.includes("T")) return WORKDAY_START_MIN;
  const hhmm = fmtTime(iso);
  if (!hhmm || !hhmm.includes(":")) return WORKDAY_START_MIN;
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return (Number.isFinite(h) ? h : 8) * 60 + (Number.isFinite(m) ? m : 0);
}

export function getTimelinePercent(min: number): number {
  const clamped = Math.max(WORKDAY_START_MIN, Math.min(WORKDAY_END_MIN, min));
  return ((clamped - WORKDAY_START_MIN) / (WORKDAY_END_MIN - WORKDAY_START_MIN)) * 100;
}

export function isIntervalBusy(
  busy: readonly BusyInterval[] | undefined,
  startIso: string,
  endIso: string
): boolean {
  if (!busy || busy.length === 0) return false;
  const sMs = new Date(startIso).getTime();
  const eMs = new Date(endIso).getTime();
  return busy.some((b) => sMs < new Date(b.end).getTime() && eMs > new Date(b.start).getTime());
}

export function isRoomBusyAt(
  room: ScheduleRoom | null,
  freeMsSet: Set<number> | null,
  startIso: string,
  endIso: string
): boolean {
  if (!room) return false;
  if (isIntervalBusy(room.busy, startIso, endIso)) return true;
  if (freeMsSet) return !freeMsSet.has(new Date(startIso).getTime());
  return false;
}

export function mergeFreeWindows(slots: readonly ScheduleSlot[]): BusyInterval[] {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  const merged: { start: string; end: string }[] = [{ start: sorted[0].start, end: sorted[0].end }];
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = sorted[i];
    if (new Date(cur.start).getTime() <= new Date(prev.end).getTime()) {
      if (new Date(cur.end).getTime() > new Date(prev.end).getTime()) {
        prev.end = cur.end;
      }
    } else {
      merged.push({ start: cur.start, end: cur.end });
    }
  }
  return merged;
}

export function expandTo15MinSlots(
  mutualSlots: readonly ScheduleSlot[],
  durationMinutes: number,
  allBusy: readonly BusyInterval[] = []
): ScheduleSlot[] {
  if (mutualSlots.length === 0) return [];
  const durationMs = Math.max(15, durationMinutes) * 60 * 1000;
  const bookedByStart = new Map<number, boolean>();
  for (const s of mutualSlots) {
    if (s.booked) bookedByStart.set(new Date(s.start).getTime(), true);
  }
  const windows = mergeFreeWindows(mutualSlots);
  const result: ScheduleSlot[] = [];
  const seen = new Set<number>();

  let hasValidWindow = false;
  for (const w of windows) {
    const wStartMs = new Date(w.start).getTime();
    const wEndMs = new Date(w.end).getTime();
    if (Number.isNaN(wStartMs) || Number.isNaN(wEndMs)) continue;
    hasValidWindow = true;
    for (let t = wStartMs; t + durationMs <= wEndMs; t += STEP_15_MS) {
      if (!seen.has(t)) {
        seen.add(t);
        const sIso = new Date(t).toISOString();
        const eIso = new Date(t + durationMs).toISOString();
        if (!isIntervalBusy(allBusy, sIso, eIso)) {
          result.push({ start: sIso, end: eIso, booked: bookedByStart.get(t) });
        }
      }
    }
  }
  return hasValidWindow ? result : [...mutualSlots];
}

export function pickRecommendedRoom(
  rooms: readonly ScheduleRoom[],
  attendeeCount: number,
  slots: readonly ScheduleSlot[]
): ScheduleRoom | null {
  if (rooms.length === 0) return null;
  const needed = Math.max(1, attendeeCount);
  const fitting = rooms.filter((r) => (r.capacity || 0) >= needed);
  if (fitting.length === 0) return null;
  const freeScore = (r: ScheduleRoom) =>
    slots.filter((s) => !isIntervalBusy(r.busy, s.start, s.end)).length;
  return (
    [...fitting].sort((a, b) => {
      const capDiff = (a.capacity || 0) - (b.capacity || 0);
      return capDiff !== 0 ? capDiff : freeScore(b) - freeScore(a);
    })[0] || null
  );
}

export function getRoomBusyIntervals(
  room: ScheduleRoom | null,
  freeMsSet: Set<number> | null,
  allSlots: readonly ScheduleSlot[]
): BusyInterval[] {
  if (!room) return [];
  if (!freeMsSet) return mergeFreeWindows(room.busy ?? []);
  const slotBusy = allSlots
    .filter((s) => isRoomBusyAt(room, freeMsSet, s.start, s.end))
    .map((s) => ({ start: s.start, end: s.end }));
  return mergeFreeWindows([...(room.busy ?? []), ...slotBusy]);
}

export function findClosestSlotByClientX(
  clientX: number,
  rectLeft: number,
  rectWidth: number,
  slots: readonly ScheduleSlot[]
): ScheduleSlot | null {
  if (slots.length === 0 || rectWidth <= 0) return null;
  const pct = Math.max(0, Math.min(1, (clientX - rectLeft) / rectWidth));
  const targetMin = WORKDAY_START_MIN + pct * (WORKDAY_END_MIN - WORKDAY_START_MIN);
  let best = slots[0];
  let bestDist = Infinity;
  for (const s of slots) {
    const mid = (getIctMinutes(s.start) + getIctMinutes(s.end)) / 2;
    const dist = Math.abs(mid - targetMin);
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return best;
}

export function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
