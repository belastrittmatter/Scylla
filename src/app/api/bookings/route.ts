import { BookingService } from "@/services/booking";
import { CreateBookingPayloadSchema } from "@/actions/schemas";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const parseResult = CreateBookingPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    let organizerUserId = data.organizerUserId;
    if (!organizerUserId || organizerUserId === "me") {
      try {
        const session = await auth.api.getSession({ headers: req.headers });
        organizerUserId = session?.user?.id;
      } catch {
        // ignore
      }
    }

    if (!organizerUserId) {
      return Response.json(
        { error: "Organizer user ID is required when unauthenticated" },
        { status: 400 }
      );
    }

    const newBooking = await BookingService.createBooking({
      ...data,
      organizerUserId,
    });

    return Response.json(newBooking, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create booking" },
      { status: 500 }
    );
  }
}
