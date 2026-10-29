import { RoomService } from "@/services/rooms";

export async function POST(_req?: Request) {
  try {
    const rooms = await RoomService.syncRoomsFromGoogle();
    return Response.json(
      {
        success: true,
        count: rooms.length,
        rooms,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync rooms";
    const lower = message.toLowerCase();

    let status = 500;
    if (
      lower.includes("403") ||
      lower.includes("permission") ||
      lower.includes("forbidden") ||
      lower.includes("disabled") ||
      lower.includes("has not been used") ||
      lower.includes("admin sdk api")
    ) {
      status = 403;
    } else if (
      lower.includes("unauthorized") ||
      lower.includes("not available") ||
      lower.includes("401")
    ) {
      status = 401;
    }

    return Response.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
