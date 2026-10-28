import { BookingService } from "@/services/booking";
import { GetAgendaParamsSchema } from "@/actions/schemas";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date") || url.searchParams.get("dateIso");
    let userId = url.searchParams.get("userId") || undefined;

    if (!dateParam) {
      return Response.json({ error: "Date parameter is required" }, { status: 400 });
    }

    if (!userId || userId === "me") {
      try {
        const session = await auth.api.getSession({ headers: req.headers });
        userId = session?.user?.id;
      } catch {
        // ignore
      }
    }

    if (!userId) {
      return Response.json({ error: "User ID is required when unauthenticated" }, { status: 400 });
    }

    const parseResult = GetAgendaParamsSchema.safeParse({
      dateIso: dateParam,
      userId,
    });

    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const agenda = await BookingService.getAgenda(userId, parseResult.data.dateIso);
    return Response.json(agenda, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch agenda" },
      { status: 500 }
    );
  }
}
