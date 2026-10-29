import {
  fmtTime,
  formatEmailToName,
  formatNames,
} from "@/components/mcp-ui/mcp-ui-types";
import {
  formatDurationSeconds,
  formatEstimatedMinutes,
} from "@/components/tasks/task-utils";

export { formatEmailToName };
export const formatNamesList = formatNames;

export function formatDate(dateStr: string | Date): string {
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return String(dateStr);
  }
}

export function formatTime(dateStr: string | Date): string {
  return fmtTime(typeof dateStr === "string" ? dateStr : dateStr.toISOString());
}

export interface PersonalCalendarInput {
  user: { name: string; email: string };
  baseDate: string;
  events: Array<{
    title?: string;
    summary?: string;
    start: string;
    end: string;
    location?: string | null;
    meetingUrl?: string | null;
  }>;
}

export function buildPersonalCalendarMarkdown(
  input: PersonalCalendarInput,
): string {
  const { user, baseDate, events = [] } = input;
  const formattedDate = formatDate(baseDate);

  const lines = [
    `# Calendar Agenda: ${user.name} (${user.email})`,
    `**Date**: ${formattedDate}`,
    "",
  ];

  if (events.length === 0) {
    lines.push("_No events scheduled for this period._");
  } else {
    lines.push("| Time | Event | Location / Meeting Link |");
    lines.push("| :--- | :--- | :--- |");
    for (const e of events) {
      const timeStr = `${formatTime(e.start)} - ${formatTime(e.end)}`;
      const title = e.title || e.summary || "Untitled Meeting";
      const linkStr = e.meetingUrl
        ? `[Join Meeting](${e.meetingUrl})`
        : e.location || "-";
      lines.push(`| **${timeStr}** | ${title} | ${linkStr} |`);
    }
  }

  return lines.join("\n");
}

export interface ScheduleComparisonInput {
  currentUser: { name: string; email: string };
  targetUser: { name: string; email: string; title?: string };
  allAttendees?: Array<{ name: string; email: string } | string>;
  dateStr: string;
  currentUserBusy?: Array<{ start: string; end: string }>;
  targetUserBusy?: Array<{ start: string; end: string }>;
  mutualSlots: Array<{ start: string; end: string }>;
  durationMinutes?: number;
  room?: { name: string; capacity?: number; email?: string } | null;
  suggestedTitle?: string;
}

export function buildScheduleComparisonMarkdown(
  input: ScheduleComparisonInput,
): string {
  const {
    currentUser,
    targetUser,
    allAttendees,
    dateStr,
    mutualSlots = [],
    durationMinutes = 30,
    room,
    suggestedTitle,
  } = input;
  const formattedDate = formatDate(dateStr);

  const names: string[] = [];
  if (currentUser?.name) {
    names.push(currentUser.name);
  } else if (currentUser?.email) {
    names.push(formatEmailToName(currentUser.email));
  }

  if (allAttendees && allAttendees.length > 0) {
    for (const a of allAttendees) {
      const n =
        typeof a === "string"
          ? formatEmailToName(a)
          : a.name || formatEmailToName(a.email);
      if (n && !names.includes(n)) names.push(n);
    }
  } else if (targetUser) {
    const n = targetUser.name || formatEmailToName(targetUser.email);
    if (n && !names.includes(n)) names.push(n);
  }

  const titleHeader = formatNamesList(names) || "Schedule Comparison";

  const lines = [
    `# Schedule Comparison: ${titleHeader}`,
    `**Date**: ${formattedDate} | **Meeting Duration**: ${durationMinutes} minutes`,
  ];

  if (room) {
    lines.push(
      `**Location / Room**: ${room.name}${room.capacity ? ` (${room.capacity} seats)` : ""}`,
    );
  }
  if (suggestedTitle) {
    lines.push(`**Suggested Title**: ${suggestedTitle}`);
  }

  lines.push("", "### Recommended Mutual Free Slots");

  if (mutualSlots.length === 0) {
    lines.push(
      `_No mutual free slots found on this day for a ${durationMinutes}-minute meeting._`,
    );
  } else {
    for (const slot of mutualSlots) {
      lines.push(
        `- **${formatTime(slot.start)} - ${formatTime(slot.end)}** (ICT)`,
      );
    }
  }

  return lines.join("\n");
}

export interface TaskBoardInput {
  teamName: string;
  projectName?: string;
  tasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority?: string | null;
    assigneeName?: string | null;
    dueDate?: string | Date | null;
    estimatedMinutes?: number | null;
    totalSpentSeconds?: number | null;
    activeSessionStartedAt?: string | null;
  }>;
}

export function buildTaskBoardMarkdown(input: TaskBoardInput): string {
  const { teamName, projectName, tasks = [] } = input;

  const columns = [
    { id: "todo", label: "To Do" },
    { id: "in_progress", label: "In Progress" },
    { id: "in_review", label: "In Review" },
    { id: "done", label: "Done" },
    { id: "cancelled", label: "Cancelled" },
  ];

  const lines = [
    `# Task Board: ${teamName}${projectName ? ` (${projectName})` : ""}`,
    `**Total Tasks**: ${tasks.length}`,
    "",
  ];

  for (const col of columns) {
    const colTasks = tasks.filter((t) => t.status === col.id);
    lines.push(`### ${col.label} (${colTasks.length})`);
    if (colTasks.length === 0) {
      lines.push("_No tasks_");
    } else {
      for (const t of colTasks) {
        const check = t.status === "done" ? "[x]" : "[ ]";
        const prio = (t.priority || "medium").toUpperCase();
        const assignee = t.assigneeName ? ` | Assignee: ${t.assigneeName}` : "";
        const due = t.dueDate ? ` | Due: ${formatDate(t.dueDate)}` : "";
        let timeStr = "";
        if (
          (t.totalSpentSeconds !== undefined && t.totalSpentSeconds !== null) ||
          (t.estimatedMinutes !== undefined && t.estimatedMinutes !== null) ||
          t.activeSessionStartedAt
        ) {
          const spentSec = t.totalSpentSeconds ?? 0;
          const spentFormatted = formatDurationSeconds(spentSec);
          const estFormatted = formatEstimatedMinutes(t.estimatedMinutes ?? 60);
          const activeNote = t.activeSessionStartedAt ? " (active timer)" : "";
          timeStr = ` | ⏱ ${spentFormatted} / ${estFormatted}${activeNote}`;
        }
        lines.push(
          `- ${check} **${t.title}** \`[${prio}]\`${assignee}${due}${timeStr}`,
        );
        if (t.description) {
          lines.push(`  > ${t.description.split("\n").join("\n  > ")}`);
        }
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
