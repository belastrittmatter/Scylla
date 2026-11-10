import { getPersonInitials } from "@/lib/format-person-name";
import type { KanbanTask } from "@/components/mcp-ui/mcp-ui-types";
import type { TaskItem } from "@/components/tasks/task-types";

/** Maps an MCP board payload task to the shared TaskItem shape (display fields only). */
export function toTaskItem(t: KanbanTask): TaskItem {
  const due = t.dueDate ? new Date(t.dueDate) : null;
  const name = t.assigneeName?.trim();
  const now = new Date();
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    status: t.status,
    priority: (t.priority || "medium").toLowerCase(),
    dueDate: due && !Number.isNaN(due.getTime()) ? due : null,
    estimatedMinutes: t.estimatedMinutes ?? null,
    totalSpentSeconds: t.totalSpentSeconds,
    activeSessionStartedAt: t.activeSessionStartedAt,
    // Not in the board payload; the read-only board never displays them.
    projectId: null,
    teamId: "",
    creatorId: "",
    assigneeId: name ?? null,
    position: 0,
    createdAt: now,
    updatedAt: now,
    assignee: name
      ? {
          id: name,
          name,
          email: "",
          role: "member",
          initials: getPersonInitials(name),
        }
      : null,
  };
}
