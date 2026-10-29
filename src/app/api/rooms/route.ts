import { RoomService, type RoomFilter } from "@/services/rooms";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { account } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
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

    // Resolve current user session & Google OAuth token
    let sessionUserId: string | undefined;
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user) {
        sessionUserId = session.user.id;
      }
    } catch {
      // Ignore session retrieval error
    }

    let googleAccount = null;
    if (sessionUserId) {
      const accounts = await db
        .select()
        .from(account)
        .where(eq(account.userId, sessionUserId));
      googleAccount = accounts.find((a) => a.providerId === "google") || null;
    }
    if (!googleAccount) {
      const anyGoogleAccounts = await db
        .select()
        .from(account)
        .where(eq(account.providerId, "google"))
        .limit(1);
      if (anyGoogleAccounts.length > 0) {
        googleAccount = anyGoogleAccounts[0];
      }
    }

    const rooms = await RoomService.listRooms(filter, {
      accountRecord: googleAccount || undefined,
      accessToken: googleAccount?.accessToken || undefined,
    });
    return Response.json(rooms, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch rooms" },
      { status: 500 },
    );
  }
}
