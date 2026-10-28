import type { McpServer } from "@modelcontextprotocol/server";
import { GoogleCalendarService } from "@/services/google-calendar";
import { SchedulerService } from "@/services/scheduler";
import { buildPersonalCalendarMarkdown } from "@/utils/mcp-markdown-builder";
import { getAgendaUiHtml } from "@/utils/mcp-ui-builder";
import { getMyAgendaSchema, listEventTypesSchema } from "../schemas";
import type { McpToolContext } from "../types";

export function registerAgendaTools(server: McpServer, ctx: McpToolContext) {
  // 0. Register UI Resource for MCP Apps (SEP-1865)
  server.registerResource(
    "calendar_agenda_app",
    "ui://calendar/agenda",
    {
      mimeType: "text/html;profile=mcp-app",
      description:
        "MCP App UI resource for get_my_agenda. Renders the authenticated user's daily calendar timeline (08:00-18:00 ICT), meeting blocks, Google Meet links, and day-by-day pagination.",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html;profile=mcp-app",
          text: getAgendaUiHtml(),
        },
      ],
    })
  );

  // 1. Tool: list_event_types
  server.registerTool(
    "list_event_types",
    {
      description: "List available meeting templates, durations, and booking event types.",
      inputSchema: listEventTypesSchema,
    },
    async () => {
      const eventTypes = await SchedulerService.getEventTypes(ctx.userId);
      return {
        content: [{ type: "text", text: JSON.stringify(eventTypes, null, 2) }],
      };
    }
  );

  // 2. Tool: get_my_agenda
  server.registerTool(
    "get_my_agenda",
    {
      description:
        "Retrieve the authenticated user's Google Calendar agenda and meetings for 1 day by default (or multiple days via the days parameter). Returns a Markdown schedule table and mounts the interactive calendar_agenda_app (ui://calendar/agenda) with day pagination and Google Meet join links.",
      inputSchema: getMyAgendaSchema,
      _meta: {
        ui: {
          resourceUri: "ui://calendar/agenda",
          visibility: ["model", "app"],
        },
        "ui/resourceUri": "ui://calendar/agenda",
      },
    },
    async ({ date, days = 1 }) => {
      const [token, currentUserProfile] = await Promise.all([
        ctx.getAccessToken(),
        ctx.getCurrentUser(),
      ]);
      if (!token) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Error: No valid Google Calendar authorization available. Please sign in with Google.",
            },
          ],
        };
      }

      const currentEmail = currentUserProfile.email || "me@example.com";

      const todayIct = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      const dateStr = date ? date.split("T")[0] : todayIct;
      const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);
      const endOfDay = new Date(startOfDay.getTime() + (days || 1) * 24 * 60 * 60 * 1000 - 1);

      const events = await GoogleCalendarService.listEvents("primary", {
        accessToken: token,
        timeMin: startOfDay,
        timeMax: endOfDay,
        singleEvents: true,
        orderBy: "startTime",
      });

      const mappedEvents = events.map((e) => {
        const startObj =
          typeof e.start === "object" && e.start
            ? (e.start as { dateTime?: string; date?: string })
            : null;
        const endObj =
          typeof e.end === "object" && e.end
            ? (e.end as { dateTime?: string; date?: string })
            : null;
        const startVal =
          typeof e.start === "string" ? e.start : startObj?.dateTime || startObj?.date || "";
        const endVal = typeof e.end === "string" ? e.end : endObj?.dateTime || endObj?.date || "";
        return {
          id: e.id,
          title: e.summary,
          summary: e.summary,
          start: startVal,
          end: endVal,
          meetingUrl: e.meetingUrl || e.hangoutsLink,
          location: e.location,
          attendees: e.attendees,
          status: e.status,
        };
      });

      const userObj = {
        name: currentUserProfile.name || "My Calendar",
        email: currentEmail,
      };

      const markdown = buildPersonalCalendarMarkdown({
        user: userObj,
        baseDate: dateStr,
        events: mappedEvents,
      });

      const structuredContent = {
        user: userObj,
        baseDate: dateStr,
        events: mappedEvents,
      };

      const html = getAgendaUiHtml(structuredContent);

      return {
        content: [
          {
            type: "text",
            text: markdown,
          },
          {
            type: "resource",
            resource: {
              uri: "ui://calendar/agenda",
              mimeType: "text/html;profile=mcp-app",
              text: html,
            },
          },
        ],
        structuredContent,
      };
    }
  );
}
