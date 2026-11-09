import { resolveUserId } from "@/services/api-utils";
import {
  handleBusyQuery,
  type BusyInterval,
  type CalendarBusyInfo,
  type BusyEventItem,
} from "./busy-query-handler";

export type { BusyInterval, CalendarBusyInfo, BusyEventItem };

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
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch busy schedules",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { emails, roomIds, userIds, timeMin, timeMax } = body;

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
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch busy schedules",
      },
      { status: 500 },
    );
  }
}
