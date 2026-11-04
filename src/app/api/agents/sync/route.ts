import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncOAuthConsentsToAgents } from "@/services/agent";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncOAuthConsentsToAgents(session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
