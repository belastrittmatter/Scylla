import { BookingService } from "@/services/booking";
import { ReschedulePayloadSchema } from "@/actions/schemas";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function PATCH(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json(
        { error: "Booking ID is required" },
        { status: 400 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parseResult = ReschedulePayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const updated = await BookingService.reschedule(id, parseResult.data);
    return Response.json(updated, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reschedule booking";
    if (message.includes("not found")) {
      return Response.json({ error: message }, { status: 404 });
    }
    if (
      message.includes("cancelled") ||
      message.includes("startTime must be before endTime") ||
      message.includes("Invalid")
    ) {
      return Response.json({ error: message }, { status: 400 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json(
        { error: "Booking ID is required" },
        { status: 400 },
      );
    }

    const url = new URL(req.url);
    const allSeries = url.searchParams.get("allSeries") === "true";
    const singleOnly = url.searchParams.get("singleOnly") === "true";

    // If allSeries is specified OR singleOnly is not explicitly requested,
    // cancelSeriesByBooking will cancel the entire recurring series if repeated,
    // or just that single event if not recurring.
    if (allSeries || !singleOnly) {
      const cancelled = await BookingService.cancelSeriesByBooking(id);
      if (cancelled.length === 0) {
        return Response.json(
          { error: `Booking with ID ${id} not found` },
          { status: 404 },
        );
      }
      return Response.json(
        cancelled.length === 1 && !allSeries
          ? cancelled[0]
          : { cancelled, count: cancelled.length },
        { status: 200 },
      );
    }

    const cancelled = await BookingService.cancel(id);
    return Response.json(cancelled, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to cancel booking";
    if (message.includes("not found")) {
      return Response.json({ error: message }, { status: 404 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
