import { BookingService } from "@/services/booking";
import { RoomService } from "@/services/rooms";
import { TeamService } from "@/services/team/team-service";
import { CreateBookingPayloadSchema } from "@/actions/schemas";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { project, eventType } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parseResult = CreateBookingPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const data = parseResult.data;
    let organizerUserId: string | undefined;

    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user?.id) {
        organizerUserId = session.user.id;
      }
    } catch {
      // ignore
    }

    if (!organizerUserId && process.env.NODE_ENV === "test") {
      organizerUserId = req.headers.get("x-user-id") || data.organizerUserId;
    }

    if (!organizerUserId) {
      return Response.json(
        { error: "Unauthorized: Active user session required" },
        { status: 401 },
      );
    }

    if (data.projectId) {
      const proj = await db.query.project.findFirst({
        where: eq(project.id, data.projectId),
      });
      if (!proj) {
        return Response.json(
          { error: `Project with id "${data.projectId}" not found` },
          { status: 400 },
        );
      }
      const isMember = await TeamService.isTeamMember(
        proj.teamId,
        organizerUserId,
      );
      if (!isMember) {
        return Response.json(
          { error: "Forbidden: Organizer is not a member of the project team" },
          { status: 403 },
        );
      }
    }

    if (data.roomId) {
      const room = await RoomService.getRoomById(data.roomId);
      if (!room) {
        return Response.json(
          { error: `Room with id "${data.roomId}" not found` },
          { status: 400 },
        );
      }
    }

    if (data.eventTypeId) {
      const et = await db.query.eventType.findFirst({
        where: eq(eventType.id, data.eventTypeId),
      });
      if (!et) {
        return Response.json(
          { error: `Event type with id "${data.eventTypeId}" not found` },
          { status: 400 },
        );
      }
      if (et.userId && et.userId !== organizerUserId) {
        return Response.json(
          { error: "Forbidden: Event type does not belong to organizer" },
          { status: 403 },
        );
      }
    }

    const newBooking = await BookingService.createBooking({
      ...data,
      organizerUserId,
    });

    return Response.json(newBooking, { status: 201 });
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Failed to create booking",
      },
      { status: 500 },
    );
  }
}
