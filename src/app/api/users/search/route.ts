import { UserService } from "@/services/user";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { account } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
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
      limit = parsedLimit;
    }

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

    const users = await UserService.searchTeammates(q, limit, {
      accountRecord: googleAccount || undefined,
      accessToken: googleAccount?.accessToken || undefined,
    });
    return Response.json(users, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to search users" },
      { status: 500 },
    );
  }
}
