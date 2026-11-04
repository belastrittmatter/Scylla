import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { updateMcpClientScopes } from "@/services/agent";

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
    const scopes = body?.scopes;

    if (!targetId || typeof targetId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid clientId" },
        { status: 400 },
      );
    }

    if (!Array.isArray(scopes)) {
      return NextResponse.json(
        { error: "Missing or invalid scopes array" },
        { status: 400 },
      );
    }

    const updated = await updateMcpClientScopes(
      session.user.id,
      targetId,
      scopes,
    );

    return NextResponse.json({ success: true, scopes: updated });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update scopes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
