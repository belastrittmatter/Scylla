import { resolveUserId } from "@/services/api-utils";
import { z } from "zod";
import {
  BusyQueryError,
  handleBusyQuery,
  type BusyInterval,
  type CalendarBusyInfo,
  type BusyEventItem,
} from "./busy-query-handler";

export type { BusyInterval, CalendarBusyInfo, BusyEventItem };

const MAX_LIST_ITEMS = 50;

// Accepts an array or a comma-separated string; at most MAX_LIST_ITEMS entries.
const listParam = z
  .union([z.array(z.string()), z.string().transform((v) => v.split(","))])
  .transform((list) => list.map((v) => v.trim()).filter(Boolean))
  .pipe(z.array(z.string()).max(MAX_LIST_ITEMS))
  .optional();

const BusyQuerySchema = z.object({
  emails: listParam,
  roomIds: listParam,
  userIds: listParam,
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
});

async function respond(req: Request, input: unknown) {
  try {
    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parseResult = BusyQuerySchema.safeParse(input);
    if (!parseResult.success) {
      return Response.json(
        { error: "Invalid busy query parameters" },
        { status: 400 },
      );
    }

    const result = await handleBusyQuery({ callerId, ...parseResult.data });
    return Response.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof BusyQueryError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error("Busy query failed:", err);
    return Response.json(
      { error: "Failed to fetch busy schedules" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  return respond(req, {
    emails: params.get("emails") || undefined,
    roomIds: params.get("roomIds") || undefined,
    userIds: params.get("userIds") || undefined,
    timeMin: params.get("timeMin") || undefined,
    timeMax: params.get("timeMax") || undefined,
  });
}

export async function POST(req: Request) {
  return respond(req, await req.json().catch(() => ({})));
}
