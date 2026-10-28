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
          .describe("Target colleague name, nickname, or email (e.g. 'alex')"),
        date: z.string().optional().describe("Meeting date (YYYY-MM-DD or 'today')"),
      }),
    },
    (args) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please help me schedule a meeting with ${args.targetUser}${args.date ? ` on ${args.date}` : ""}.
Follow this workflow:
1. Check if I need an offline meeting room or online Google Meet (ask if not specified).
2. If offline, use list_meeting_rooms with minCapacity matching attendee count to find a suitable room.
3. Call compare_schedules to show me the time slot picker UI.
4. Suggest a concise meeting title and agenda for me to confirm.
5. Once confirmed, book the meeting.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "create_task_flow",
    {
      description:
        "Guided conversational task creation workflow: ensures project is specified, prompts user with available project options if not specified, and creates task scoped to project.",
      argsSchema: z.object({
        teamId: z.string().describe("Team ID or slug"),
        title: z.string().describe("Task title"),
        projectId: z
          .string()
          .optional()
          .describe("Optional project ID or slug if specified by user"),
      }),
    },
    (args) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please help me create a task: "${args.title}" in team "${args.teamId}"${args.projectId ? ` for project "${args.projectId}"` : ""}.
Follow this workflow:
1. Every task requires a project. If project is not specified by the user, call list_projects (or create_task without projectId) to get available projects and prompt the user to select one.
2. Once the project is selected or confirmed, create the task with that projectId.`,
          },
        },
      ],
    })
  );
}
