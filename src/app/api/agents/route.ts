import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { listConnectedMcpClients } from "@/services/agent";

export async function GET(req: NextRequest) {
  try {
    let session = null;
    try {
      const nextHeaders = await headers();
      session = await auth.api.getSession({ headers: nextHeaders });
    } catch {
      // Fallback
    }

    if (!session?.user?.id) {
      session = await auth.api.getSession({ headers: req.headers });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clients = await listConnectedMcpClients(session.user.id);
    return NextResponse.json(
      { clients, agents: clients },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch agents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
