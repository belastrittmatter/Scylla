import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";

export function registerAllMcpPrompts(server: McpServer) {
  server.registerPrompt(
    "book_meeting_flow",
    {
      description:
        "Guided conversational meeting booking workflow: check online vs offline, search rooms (MRTR) if offline, present slot UI, suggest title/agenda, confirm, and book.",
      argsSchema: z.object({
        targetUser: z
          .string()
          .optional()
          .describe(
            "Target colleague name, nickname, or email (e.g. 'anh pham')",
          ),
        date: z
          .string()
          .optional()
          .describe("Meeting date (YYYY-MM-DD or 'today')"),
      }),
    },
    (args) => {
      const targetUser = args.targetUser?.trim();
      const dateClause = args.date?.trim() ? ` on ${args.date.trim()}` : "";
      const whoClause = targetUser
        ? `with ${targetUser}${dateClause}`
        : `with a colleague${dateClause} (ask me who I want to meet with if not specified)`;

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please help me schedule a meeting ${whoClause}.
Follow this workflow:
1. Check if I need an offline meeting room or online Google Meet (ask if not specified).
2. If offline, use list_meeting_rooms with minCapacity matching attendee count to find a suitable room.
3. Call compare_schedules to show me the time slot picker UI.
4. Suggest a concise meeting title and agenda for me to confirm.
5. Once confirmed, book the meeting.`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "create_task_flow",
    {
      description:
        "Guided conversational task creation workflow: ensures project is specified, prompts user with available project options if not specified, and creates task scoped to project.",
      argsSchema: z.object({
        teamId: z.string().optional().describe("Team ID or slug"),
        title: z.string().optional().describe("Task title"),
        projectId: z
          .string()
          .optional()
          .describe("Optional project ID or slug if specified by user"),
      }),
    },
    (args) => {
      const title = args.title?.trim();
      const teamId = args.teamId?.trim();
      const projectId = args.projectId?.trim();

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please help me create a task${title ? `: "${title}"` : " (ask me for the task title if not specified)"}${teamId ? ` in team "${teamId}"` : " (call list_teams if team is not specified)"}${projectId ? ` for project "${projectId}"` : ""}.
Follow this workflow:
1. Every task requires a project. If project is not specified by the user, call list_projects (or create_task without projectId) to get available projects and prompt the user to select one.
2. Once the project is selected or confirmed, create the task with that projectId.`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "daily_meeting_flow",
    {
      description:
        "Guided workflow for scheduling a daily standup / team sync: resolves team members, supports recurring daily repeat for 1 week (5 working days), checks room requirements, finds conflict-free slot, and books meeting.",
      argsSchema: z.object({
        teamId: z
          .string()
          .optional()
          .describe("Team ID or slug to schedule daily standup for"),
        date: z
          .string()
          .optional()
          .describe(
            "Target start date for daily meeting (YYYY-MM-DD or 'today')",
          ),
        durationMinutes: z
          .union([z.number(), z.string()])
          .optional()
          .default(15)
          .describe("Meeting duration in minutes (defaults to 15m)"),
        isOffline: z
          .union([z.boolean(), z.string()])
          .optional()
          .describe("Whether a physical meeting room is required"),
        repeatDays: z
          .union([z.number(), z.string()])
          .optional()
          .default(1)
          .describe(
            "Number of consecutive workdays to book (e.g. 5 for a 1-week repeat)",
          ),
      }),
    },
    (args) => {
      const teamId = args.teamId?.trim() || "<ask-or-list-teams>";
      const durationMinutes =
        typeof args.durationMinutes === "number"
          ? args.durationMinutes
          : Number(args.durationMinutes) || 15;
      const repeatDays =
        typeof args.repeatDays === "number"
          ? args.repeatDays
          : Number(args.repeatDays) || 1;
      const isOffline =
        args.isOffline === true ||
        (typeof args.isOffline === "string" &&
          args.isOffline.toLowerCase() === "true");
      const startDate = args.date && args.date.trim() ? args.date : "today";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please help schedule the daily standup for team "${teamId}" starting on ${startDate}${repeatDays > 1 ? ` repeating for ${repeatDays} workdays (1 week)` : ""}.
Follow this daily meeting workflow:
1. Fetch all members of team "${teamId}" using 'list_team_members' (if team is not specified, call 'list_teams' first) to assemble the attendee list.
2. Determine if an offline room is needed (if isOffline=${isOffline} or requested by user). If offline, call 'list_meeting_rooms' with minCapacity matching team size.
3. Call 'find_common_meeting_slots' for all team members (duration: ${durationMinutes} minutes) on ${startDate} to identify the target recurring standup time window (e.g., 09:30 - 09:45).
4. If repeating for 1 week (repeatDays: ${repeatDays}):
   - Propose the schedule for Monday through Friday at that established time slot.
   - For each workday in that 1-week window, call 'book_meeting' at the same time slot for that day.
5. Suggest a clean meeting title (e.g. "[Team] Daily Standup") and brief 3-point standup agenda (Yesterday, Today, Blockers).
6. Confirm with me, then finalize all bookings with calendar invites and Google Meet links.`,
            },
          },
        ],
      };
    },
  );
}
