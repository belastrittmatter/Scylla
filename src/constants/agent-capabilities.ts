export interface McpCapabilityDefinition {
  id: string;
  label: string;
  description: string;
  category?: "calendar" | "rooms" | "tasks" | "projects" | "teams";
  isDestructive?: boolean;
}

export const ALL_MCP_CAPABILITIES: readonly McpCapabilityDefinition[] = [
  // Calendar
  {
    id: "calendar.readonly",
    label: "Calendar Read-Only",
    description: "View calendar availability and agendas",
    category: "calendar",
  },
  {
    id: "calendar.events",
    label: "Calendar Management",
    description: "Create, reschedule, and cancel calendar events",
    category: "calendar",
  },
  // Rooms
  {
    id: "rooms.reservation",
    label: "Room Booking",
    description: "Search and reserve meeting rooms",
    category: "rooms",
  },
  // Tasks
  {
    id: "tasks.readonly",
    label: "Task Read-Only",
    description: "View workspace tasks, comments, and kanban boards",
    category: "tasks",
  },
  {
    id: "tasks.write",
    label: "Task Management",
    description: "Create and update workspace tasks and comments",
    category: "tasks",
  },
  {
    id: "tasks.delete",
    label: "Task Deletion",
    description: "Permanently delete workspace tasks",
    category: "tasks",
    isDestructive: true,
  },
  // Projects
  {
    id: "projects.readonly",
    label: "Project Read-Only",
    description: "View project workspaces and metadata",
    category: "projects",
  },
  {
    id: "projects.manage",
    label: "Project Management",
    description: "Create and configure project workspaces",
    category: "projects",
  },
  {
    id: "projects.delete",
    label: "Project Deletion",
    description: "Permanently delete project workspaces",
    category: "projects",
    isDestructive: true,
  },
  // Teams
  {
    id: "teams.readonly",
    label: "Team Read-Only",
    description: "View team workspaces and member rosters",
    category: "teams",
  },
  {
    id: "teams.manage",
    label: "Team Management",
    description: "Manage team workspaces and memberships",
    category: "teams",
  },
  {
    id: "teams.delete",
    label: "Team Deletion",
    description: "Permanently delete team workspaces",
    category: "teams",
    isDestructive: true,
  },
] as const;

export function getHumanReadableCapabilities(scopes?: string[]): string[] {
  if (!scopes || scopes.length === 0) return [];
  const set = new Set(scopes);
  const caps: string[] = [];

  if (set.has("calendar.events") || set.has("calendar.*") || set.has("*")) {
    caps.push("Calendar (Full)");
  } else if (set.has("calendar.readonly")) {
    caps.push("Calendar (Read-only)");
  }

  if (set.has("rooms.reservation") || set.has("rooms.*") || set.has("*")) {
    caps.push("Room Booking");
  }

  if (set.has("tasks.delete")) {
    caps.push("Tasks (Delete)");
  } else if (set.has("tasks.write") || set.has("tasks.*") || set.has("*")) {
    caps.push("Tasks (Write)");
  } else if (set.has("tasks.readonly")) {
    caps.push("Tasks (Read-only)");
  }

  if (set.has("projects.delete")) {
    caps.push("Projects (Delete)");
  } else if (
    set.has("projects.manage") ||
    set.has("projects.*") ||
    set.has("*")
  ) {
    caps.push("Projects (Manage)");
  } else if (set.has("projects.readonly")) {
    caps.push("Projects (Read-only)");
  }

  if (set.has("teams.delete")) {
    caps.push("Teams (Delete)");
  } else if (set.has("teams.manage") || set.has("teams.*") || set.has("*")) {
    caps.push("Teams (Manage)");
  } else if (set.has("teams.readonly")) {
    caps.push("Teams (Read-only)");
  }

  return caps;
}
