import type { McpServer } from "@modelcontextprotocol/server";
import {
  GoogleCalendarService,
  type ResourceRoom,
} from "@/services/google-calendar";
import { db, meetingRoom } from "@/db";
import { listMeetingRoomsSchema } from "../schemas";
import type { McpToolContext } from "../types";

export function registerRoomsTools(server: McpServer, ctx: McpToolContext) {
  server.registerTool(
    "list_meeting_rooms",
    {
      description:
        "Query available physical meeting rooms and Google Calendar resource rooms by office location and capacity (MRTR - Meeting Room Tool/Resource). Use this when an offline / in-person meeting room is needed to find rooms matching the attendee headcount.",
      inputSchema: listMeetingRoomsSchema,
      _meta: {
        ui: { visibility: ["model", "app"] },
      },
    },
    async ({ officeLocation, minCapacity }) => {
      const [googleRooms, dbRooms] = await Promise.all([
        ctx
          .getAccessToken()
          .then((token) =>
            GoogleCalendarService.listResourceRooms({
              accessToken: token || undefined,
            }),
          )
          .catch((err) => {
            console.warn(
              "Could not fetch Google resource rooms in list_meeting_rooms:",
              err,
            );
            return [] as ResourceRoom[];
          }),
        db.select().from(meetingRoom),
      ]);

      // Merge DB rooms and Google Calendar resource rooms
      const combined = [...dbRooms];
      for (const gr of googleRooms) {
        const alreadyExists = combined.some(
          (r) =>
            r.email.toLowerCase() === gr.email.toLowerCase() ||
            (r.googleResourceEmail &&
              r.googleResourceEmail.toLowerCase() === gr.email.toLowerCase()),
        );

        if (!alreadyExists) {
          combined.push({
            id: gr.id,
            name: gr.name,
            email: gr.email,
            googleResourceEmail: gr.email,
            officeLocation: gr.building || "hcm",
            capacity: gr.capacity || 0,
            features: gr.features || [],
            equipment: [],
            building: gr.building || null,
            floor: gr.floor || null,
            description: gr.description || null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      let filtered = combined;
      if (minCapacity) {
        filtered = filtered.filter((r) => (r.capacity || 0) >= minCapacity);
      }
      if (officeLocation && officeLocation !== "all") {
        filtered = filtered.filter((r) =>
          (r.officeLocation || "")
            .toLowerCase()
            .includes(officeLocation.toLowerCase()),
        );
      }

      return {
        content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }],
      };
    },
  );
}
