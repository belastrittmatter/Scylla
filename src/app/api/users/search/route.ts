import { UserService } from "@/services/user";
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
    const q = url.searchParams.get("q") ?? "";
    const limitParam = url.searchParams.get("limit");

    let limit = 20;
    if (limitParam !== null) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return Response.json(
          { error: "Invalid limit parameter" },
          { status: 400 },
        );
      }
      limit = Math.min(parsedLimit, 50);
    }

    let googleAccount = null;
    const accounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, callerId));
    googleAccount = accounts.find((a) => a.providerId === "google") || null;

    const users = await UserService.searchTeammates(q, limit, {
      currentUserId: callerId,
      accountRecord: googleAccount || undefined,
      accessToken: googleAccount?.accessToken || undefined,
    });
    return Response.json(users, { status: 200 });
  } catch (err) {
    console.error("GET /api/users/search failed:", err);
    return Response.json({ error: "Failed to search users" }, { status: 500 });
  }
}
