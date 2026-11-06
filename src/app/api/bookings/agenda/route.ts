import { BookingService } from "@/services/booking";
import { GetAgendaParamsSchema } from "@/actions/schemas";
import { resolveUserId } from "@/services/api-utils";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const dateParam =
      url.searchParams.get("date") || url.searchParams.get("dateIso");
    const queryUserId = url.searchParams.get("userId") || undefined;

    if (!dateParam) {
      return Response.json(
        { error: "Date parameter is required" },
        { status: 400 },
      );
    }

    // Resolve authenticated caller identity
    const sessionUserId = await resolveUserId(req);

    // If caller is authenticated, enforce that they cannot request another user's agenda
    if (sessionUserId) {
      if (
        queryUserId &&
        queryUserId !== "me" &&
        queryUserId !== sessionUserId
      ) {
        return Response.json(
          { error: "Forbidden: You cannot access another user's agenda" },
          { status: 403 },
        );
      }
    }

    // Determine target user ID (session user, or explicit fallback when unauthenticated in test environment)
    const targetUserId =
      sessionUserId || (await resolveUserId(req, queryUserId));

    if (!targetUserId) {
      return Response.json(
        { error: "User ID is required when unauthenticated" },
        { status: 400 },
      );
    }

    const parseResult = GetAgendaParamsSchema.safeParse({
      dateIso: dateParam,
      userId: targetUserId,
    });

    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const agenda = await BookingService.getAgenda(
      targetUserId,
      parseResult.data.dateIso,
    );
    return Response.json(agenda, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch agenda" },
      { status: 500 },
    );
  }
}
