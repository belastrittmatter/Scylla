import { resolveUserId } from "@/services/api-utils";
import { z } from "zod";
import {
  handleBusyQuery,
  type BusyInterval,
  type CalendarBusyInfo,
  type BusyEventItem,
} from "./busy-query-handler";

export type { BusyInterval, CalendarBusyInfo, BusyEventItem };

const BusyQuerySchema = z.object({
  emails: z.union([z.array(z.string()), z.string()]).optional(),
  roomIds: z.union([z.array(z.string()), z.string()]).optional(),
  userIds: z.union([z.array(z.string()), z.string()]).optional(),
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const emailsParam = url.searchParams.get("emails");
    const roomIdsParam = url.searchParams.get("roomIds");
    const userIdsParam = url.searchParams.get("userIds");
    const timeMin = url.searchParams.get("timeMin") || undefined;
    const timeMax = url.searchParams.get("timeMax") || undefined;

    const emails = emailsParam
      ? emailsParam
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];
    const roomIds = roomIdsParam
      ? roomIdsParam
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean)
      : [];
    const userIds = userIdsParam
      ? userIdsParam
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean)
      : [];

    const result = await handleBusyQuery({
      callerId,
      emails,
      roomIds,
      userIds,
      timeMin,
      timeMax,
    });

    return Response.json(result, { status: 200 });
  } catch (err) {
    const isBadInput =
      err instanceof Error && err.message.includes("Invalid time range");
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch busy schedules",
      },
      { status: isBadInput ? 400 : 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = BusyQuerySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return Response.json(
        { error: "Invalid busy query body parameters" },
        { status: 400 },
      );
    }
    const { emails, roomIds, userIds, timeMin, timeMax } = parseResult.data;

    const result = await handleBusyQuery({
      callerId,
      emails: Array.isArray(emails)
        ? emails
        : typeof emails === "string"
          ? emails.split(",")
          : [],
      roomIds: Array.isArray(roomIds)
        ? roomIds
        : typeof roomIds === "string"
          ? roomIds.split(",")
          : [],
      userIds: Array.isArray(userIds)
        ? userIds
        : typeof userIds === "string"
          ? userIds.split(",")
          : [],
      timeMin,
      timeMax,
    });

    return Response.json(result, { status: 200 });
  } catch (err) {
    const isBadInput =
      err instanceof Error && err.message.includes("Invalid time range");
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch busy schedules",
      },
      { status: isBadInput ? 400 : 500 },
    );
  }
}
