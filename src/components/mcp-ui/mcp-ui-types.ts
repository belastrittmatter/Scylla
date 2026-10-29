export type McpViewType = "agenda" | "schedule" | "tasks";

export interface BusyInterval {
  readonly start: string;
  readonly end: string;
}

export interface McpPerson {
  readonly name?: string;
  readonly email?: string;
  readonly busy?: readonly BusyInterval[];
}

export interface AgendaEvent {
  readonly id?: string;
  readonly title?: string;
  readonly summary?: string;
  readonly start: string;
  readonly end: string;
  readonly meetingUrl?: string;
  readonly location?: string;
  readonly status?: string;
}

export interface AgendaData {
  readonly user?: McpPerson;
  readonly baseDate?: string;
  readonly events?: readonly AgendaEvent[];
}

export interface ScheduleSlot {
  readonly start: string;
  readonly end: string;
  readonly booked?: boolean;
}

export interface ScheduleRoom {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly capacity?: number;
  readonly officeLocation?: string | null;
  readonly busy?: readonly BusyInterval[];
}

export interface ScheduleData {
  readonly currentUser?: McpPerson;
  readonly targetUser?: McpPerson;
  readonly allAttendees?: readonly (string | McpPerson)[];
  readonly dateStr?: string;
  readonly durationMinutes?: number;
  readonly mutualSlots?: readonly ScheduleSlot[];
  readonly rooms?: readonly ScheduleRoom[];
  readonly selectedRoomId?: string;
  readonly suggestedTitle?: string;
  readonly suggestedAgenda?: string;
}

export interface KanbanTask {
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly status: string;
  readonly priority?: string | null;
  readonly assigneeName?: string | null;
  readonly dueDate?: string | Date | null;
  readonly estimatedMinutes?: number;
  readonly totalSpentSeconds?: number;
  readonly activeSessionStartedAt?: string | null;
}

export interface TaskBoardData {
  readonly teamId?: string;
  readonly projectId?: string;
  readonly teamName?: string;
  readonly projectName?: string;
  readonly tasks?: readonly KanbanTask[];
}

export function fmtTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return String(iso).substring(11, 16);
  }
}

export function fmtDay(iso?: string): string {
  if (!iso) return "Upcoming";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return String(iso).substring(0, 10);
  }
}

export function formatEmailToName(email?: string): string {
  if (!email) return "";
  const local = email.split("@")[0] || email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function formatNames(names: readonly string[]): string {
  if (!names || names.length === 0) return "Schedule Comparison";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export function getParticipantColumns(data?: ScheduleData | null): McpPerson[] {
  if (!data) return [];
  const list: McpPerson[] = [];
  const seen = new Set<string>();
  const add = (p: McpPerson) => {
    const name = p.name || formatEmailToName(p.email);
    const key = (p.email || name).toLowerCase();
    if (!name || seen.has(key)) return;
    seen.add(key);
    list.push({ name, email: p.email, busy: p.busy || [] });
  };
  if (data.currentUser) add(data.currentUser);
  if (Array.isArray(data.allAttendees) && data.allAttendees.length > 0) {
    for (const a of data.allAttendees) {
      if (typeof a === "string") {
        const matchTarget =
          data.targetUser && a === data.targetUser.email
            ? data.targetUser
            : null;
        add(matchTarget || { name: formatEmailToName(a), email: a });
      } else if (a && typeof a === "object") {
        add(a);
      }
    }
  } else if (data.targetUser) {
    add(data.targetUser);
  }
  return list;
}

export function getAttendeeNames(data?: ScheduleData | null): string[] {
  return getParticipantColumns(data)
    .map((p) => p.name || "")
    .filter(Boolean);
}

const DATA_KEYS = [
  "structuredContent",
  "result",
  "params",
  "data",
  "payload",
  "toolResult",
  "response",
  "content",
] as const;
const PAYLOAD_MARKERS = [
  "events",
  "tasks",
  "mutualSlots",
  "user",
  "teamName",
  "currentUser",
] as const;

export function extractData<T>(raw: unknown): T | null {
  if (!raw) return null;
  let obj: unknown = raw;
  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = extractData<T>(item);
      if (r) return r;
    }
    return null;
  }
  const rec = obj as Record<string, unknown>;
  if (PAYLOAD_MARKERS.some((k) => k in rec)) return rec as unknown as T;
  for (const k of DATA_KEYS) {
    if (rec[k]) {
      const r = extractData<T>(rec[k]);
      if (r) return r;
    }
  }
  return null;
}
