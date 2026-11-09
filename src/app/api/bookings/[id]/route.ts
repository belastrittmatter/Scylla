import { BookingService } from "@/services/booking";
import { ReschedulePayloadSchema } from "@/actions/schemas";
import { resolveUserId } from "@/services/api-utils";
import { z } from "zod";

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

    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await BookingService.getBookingById(id);
    if (!existing) {
      return Response.json(
        { error: `Booking with ID ${id} not found` },
        { status: 404 },
      );
    }

    if (existing.organizerUserId !== callerId && existing.userId !== callerId) {
      return Response.json(
        {
          error: "Forbidden: You are not authorized to reschedule this booking",
        },
        { status: 403 },
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

    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await BookingService.getBookingById(id);
    if (!existing) {
      return Response.json(
        { error: `Booking with ID ${id} not found` },
        { status: 404 },
      );
    }

    if (existing.organizerUserId !== callerId && existing.userId !== callerId) {
      return Response.json(
        { error: "Forbidden: You are not authorized to cancel this booking" },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const allSeries = url.searchParams.get("allSeries") === "true";
    const ReasonSchema = z.string().trim().min(1).max(500);
    let rawReason: unknown = url.searchParams.get("reason") || undefined;
    try {
      const body: unknown = await req.json();
      if (body && typeof body === "object" && "reason" in body) {
        rawReason = (body as { reason: unknown }).reason;
      }
    } catch {}
    const parsedReason = ReasonSchema.optional().safeParse(rawReason);
    if (!parsedReason.success) {
      return Response.json(
        { error: "Invalid cancellation reason" },
        { status: 400 },
      );
    }
    const reason = parsedReason.data;

    if (allSeries) {
      const cancelled = await BookingService.cancelSeriesByBooking(id, reason);
      if (cancelled.length === 0) {
        return Response.json(
          { error: `Booking with ID ${id} not found` },
          { status: 404 },
        );
      }
      return Response.json(
        { cancelled, count: cancelled.length },
        { status: 200 },
      );
    }

    const cancelled = await BookingService.cancel(id, reason);
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
