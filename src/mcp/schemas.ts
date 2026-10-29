import * as z from "zod";

export const resolveUserSchema = z.object({
  query: z.string().describe("Name, nickname, or partial query (e.g. 'alex')"),
  limit: z
    .number()
    .optional()
    .default(5)
    .describe("Maximum candidates to return (default 5)"),
});

export const listMeetingRoomsSchema = z.object({
  officeLocation: z
    .string()
    .optional()
    .describe("Office location filter (e.g. 'hcm', 'all')"),
  minCapacity: z
    .number()
    .optional()
    .describe(
      "Minimum room capacity required (MRTR - Meeting Room Tool/Resource). For 1:1 meetings, set to 2; for team meetings, set to the attendee headcount.",
    ),
});

export const listEventTypesSchema = z.object({});

export const findCommonMeetingSlotsSchema = z.object({
  attendees: z
    .array(z.string())
    .describe("List of participant email addresses or nicknames (e.g. 'alex')"),
  durationMinutes: z
    .number()
    .describe("Meeting duration in minutes (e.g. 30, 45, 60)"),
  startDate: z
    .string()
    .describe("Search range start date (ISO string or YYYY-MM-DD)"),
  endDate: z
    .string()
    .describe("Search range end date (ISO string or YYYY-MM-DD)"),
  timezone: z
    .string()
    .optional()
    .describe("Timezone (defaults to 'Asia/Ho_Chi_Minh')"),
  roomId: z
    .string()
    .optional()
    .describe(
      "Optional meeting room ID to include in availability search for offline meetings",
    ),
  suggestedTitle: z
    .string()
    .optional()
    .describe("Optional suggested meeting title to prefill in the schedule UI"),
});

export const compareSchedulesSchema = z.object({
  targetUser: z
    .string()
    .describe(
      "Colleague's email or name/nickname (e.g. 'alex', 'sarah@example.com')",
    ),
  date: z
    .string()
    .optional()
    .describe("Date in YYYY-MM-DD format (defaults to today)"),
  durationMinutes: z
    .number()
    .optional()
    .default(30)
    .describe("Desired meeting duration in minutes (default 30)"),
  timezone: z
    .string()
    .optional()
    .default("Asia/Ho_Chi_Minh")
    .describe("Timezone (defaults to 'Asia/Ho_Chi_Minh')"),
  roomId: z
    .string()
    .optional()
    .describe(
      "Optional meeting room ID to preselect for offline meetings (from list_meeting_rooms)",
    ),
  roomEmail: z
    .string()
    .optional()
    .describe("Optional meeting room email to preselect for offline meetings"),
  suggestedTitle: z
    .string()
    .optional()
    .describe(
      "Optional suggested meeting title (e.g. '1:1 Sync: Alice & Bob') to prefill in the UI",
    ),
  suggestedAgenda: z
    .string()
    .optional()
    .describe("Optional suggested agenda or description to prefill in the UI"),
});

export const bookMeetingSchema = z.object({
  summary: z
    .string()
    .describe(
      "Meeting title / summary. Proactively suggest this to the user before booking.",
    ),
  description: z.string().optional().describe("Meeting description or agenda"),
  start: z.string().describe("Meeting start time (ISO string)"),
  end: z.string().describe("Meeting end time (ISO string)"),
  attendees: z
    .array(z.string())
    .describe("Participant emails or nicknames (e.g. 'alex')"),
  roomEmail: z
    .string()
    .optional()
    .describe(
      "Optional Google resource room email. For offline meetings, obtain from list_meeting_rooms. Omit for online / Google Meet meetings.",
    ),
  roomId: z
    .string()
    .optional()
    .describe(
      "Optional meeting room ID if reserving a physical room. Omit for online-only meetings.",
    ),
  projectId: z
    .string()
    .optional()
    .describe(
      "Optional project ID or project slug to link this calendar event with a specific project.",
    ),
});

export const rescheduleMeetingSchema = z.object({
  eventId: z.string().describe("Google Calendar event ID or booking ID"),
  newStart: z.string().describe("New start time (ISO string)"),
  newEnd: z.string().describe("New end time (ISO string)"),
  roomEmail: z
    .string()
    .optional()
    .describe(
      "Optional new or existing room email. Omit for online-only meetings.",
    ),
  projectId: z
    .string()
    .optional()
    .describe(
      "Optional project ID or project slug to update the linked project for this meeting.",
    ),
});

export const cancelMeetingSchema = z.object({
  eventId: z.string().describe("Google Calendar event ID"),
  calendarId: z
    .string()
    .optional()
    .default("primary")
    .describe("Calendar ID (default 'primary')"),
});

export const getMyAgendaSchema = z.object({
  date: z
    .string()
    .optional()
    .describe("Base date in YYYY-MM-DD format (defaults to today)"),
  days: z
    .number()
    .optional()
    .default(1)
    .describe(
      "Number of days to fetch (defaults to 1, can be changed to fetch multiple days)",
    ),
});

export const createShareableBookingLinkSchema = z.object({
  title: z.string().describe("Meeting title (e.g. '1:1 Discussion with Alex')"),
  description: z.string().optional().describe("Meeting description or agenda"),
  durationMinutes: z
    .number()
    .optional()
    .default(30)
    .describe("Meeting duration in minutes (e.g. 15, 30, 45, 60)"),
  memberEmails: z
    .array(z.string())
    .optional()
    .describe(
      "Additional team member emails or nicknames to include in booking availability",
    ),
  locationType: z
    .enum(["meet", "room"])
    .optional()
    .default("meet")
    .describe(
      "Meeting location type: 'meet' (Google Meet) or 'room' (Physical room)",
    ),
  roomId: z.string().optional().describe("Meeting room ID if physical room"),
  allowedGuestEmails: z
    .array(z.string())
    .optional()
    .describe(
      "Restrict booking to specific guest emails (if omitted, link is public)",
    ),
});

export const listTeamsSchema = z.object({});

export const listProjectsSchema = z.object({
  teamId: z.string().describe("Team ID or slug"),
  status: z
    .enum(["planning", "active", "paused", "completed", "archived"])
    .optional()
    .describe("Optional project status filter"),
});

export const createProjectSchema = z.object({
  teamId: z.string().describe("Team ID or slug"),
  name: z.string().describe("Project name"),
  description: z.string().optional().describe("Project description"),
  status: z
    .enum(["planning", "active", "paused", "completed", "archived"])
    .optional()
    .default("active")
    .describe("Project status (defaults to 'active')"),
  color: z.string().optional().describe("Hex color code or color identifier"),
});

export const listTasksSchema = z.object({
  teamId: z.string().optional().describe("Optional Team ID or slug filter"),
  projectId: z.string().optional().describe("Optional Project ID filter"),
  user: z
    .string()
    .optional()
    .describe(
      "Target user ID, email, or nickname (e.g. 'alex', 'sarah@example.com', 'me')",
    ),
  assigneeId: z
    .string()
    .optional()
    .describe(
      "Assignee user ID, email, or nickname (alias for user parameter)",
    ),
  status: z
    .union([
      z.enum(["todo", "in_progress", "in_review", "done", "cancelled"]),
      z.array(
        z.enum(["todo", "in_progress", "in_review", "done", "cancelled"]),
      ),
    ])
    .optional()
    .describe("Task status filter"),
  priority: z
    .union([
      z.enum(["low", "medium", "high", "urgent"]),
      z.array(z.enum(["low", "medium", "high", "urgent"])),
    ])
    .optional()
    .describe("Task priority filter"),
  dueBefore: z
    .string()
    .optional()
    .describe("Filter tasks due before ISO timestamp or YYYY-MM-DD"),
  deadlineHorizonDays: z
    .number()
    .optional()
    .describe("Filter tasks due within N days from now"),
  overdue: z
    .boolean()
    .optional()
    .describe("If true, filter tasks that are overdue"),
  hasActiveSession: z
    .boolean()
    .optional()
    .describe(
      "Filter tasks by whether they have an ongoing active time session",
    ),
});

export const createTaskSchema = z.object({
  teamId: z.string().describe("Team ID or slug"),
  title: z.string().describe("Task title"),
  description: z.string().optional().describe("Task description"),
  status: z
    .enum(["todo", "in_progress", "in_review", "done", "cancelled"])
    .optional()
    .default("todo")
    .describe("Task status (defaults to 'todo')"),
  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional()
    .default("medium")
    .describe("Task priority (defaults to 'medium')"),
  projectId: z
    .string()
    .optional()
    .describe(
      "Project ID or slug (REQUIRED). Every task must belong to a project. If not provided or user did not specify a project, available projects in the team are returned for selection.",
    ),
  assigneeId: z
    .string()
    .optional()
    .describe("Assignee user ID, email, or nickname"),
  dueDate: z
    .string()
    .optional()
    .describe("Task deadline / due date (ISO timestamp or YYYY-MM-DD)"),
  estimatedMinutes: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Estimated duration in minutes (defaults to 60)"),
});

export const updateTaskSchema = z.object({
  taskId: z.string().describe("Task ID to update"),
  title: z.string().optional().describe("New task title"),
  description: z.string().optional().describe("New task description"),
  status: z
    .enum(["todo", "in_progress", "in_review", "done", "cancelled"])
    .optional()
    .describe("New task status"),
  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional()
    .describe("New task priority"),
  projectId: z
    .string()
    .optional()
    .describe(
      "New Project ID or slug. If user wants to change/assign project but didn't specify which one, pass empty or 'select' to receive available project options to choose from.",
    ),
  assigneeId: z
    .string()
    .optional()
    .describe("New Assignee user ID, email, or nickname"),
  dueDate: z
    .string()
    .optional()
    .describe("New due date (ISO timestamp or YYYY-MM-DD)"),
  estimatedMinutes: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("New estimated duration in minutes"),
});

export const getTaskBoardSchema = z.object({
  teamId: z.string().describe("Team ID or slug"),
  projectId: z.string().optional().describe("Optional Project ID filter"),
});

export const getActiveTasksSchema = z.object({
  teamId: z
    .string()
    .optional()
    .describe("Team ID or name (defaults to user's team)"),
  userId: z.string().optional().describe("Filter by assignee user ID or email"),
});

export const getTaskTimelineSchema = z.object({
  taskId: z.string().describe("Task ID to fetch session timeline for"),
});
