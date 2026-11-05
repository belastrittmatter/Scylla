import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revokeMcpClient } from "@/services/agent";

export async function POST(req: NextRequest) {
  try {
    let session = null;
    try {
      const nextHeaders = await headers();
      session = await auth.api.getSession({ headers: nextHeaders });
    } catch {
      // Fallback if called outside Next.js request async storage
    }

    if (!session?.user?.id) {
      session = await auth.api.getSession({ headers: req.headers });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetId = body?.clientId || body?.agentId;
    if (!targetId || typeof targetId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid clientId or agentId" },
        { status: 400 },
      );
    }

    await revokeMcpClient(session.user.id, targetId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Revocation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
