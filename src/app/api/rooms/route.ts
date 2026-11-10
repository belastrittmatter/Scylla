import { RoomService, type RoomFilter } from "@/services/rooms";
import { resolveUserId } from "@/services/api-utils";
import { db } from "@/db";
import { account } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const minCapacityParam = url.searchParams.get("minCapacity");
    const building = url.searchParams.get("building") || undefined;
    const featuresParam = url.searchParams.getAll("features");

    let minCapacity: number | undefined;
    if (minCapacityParam !== null) {
      minCapacity = parseInt(minCapacityParam, 10);
      if (isNaN(minCapacity) || minCapacity < 0) {
        return Response.json(
          { error: "Invalid minCapacity parameter" },
          { status: 400 },
        );
      }
    }

    let features: string[] | undefined;
    if (featuresParam.length > 0) {
      features = featuresParam
        .flatMap((f) => f.split(","))
        .map((f) => f.trim())
        .filter(Boolean);
    }

    const filter: RoomFilter = {
      minCapacity,
      features: features && features.length > 0 ? features : undefined,
      building,
    };

    const accounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, callerId));
    const googleAccount =
      accounts.find((a) => a.providerId === "google") || null;

    const rooms = await RoomService.listRooms(filter, {
      accountRecord: googleAccount || undefined,
      accessToken: googleAccount?.accessToken || undefined,
    });
    return Response.json(rooms, { status: 200 });
  } catch (err) {
    console.error("GET /api/rooms failed:", err);
    return Response.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}
