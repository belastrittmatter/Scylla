import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const config = await auth.api.getAgentConfiguration({
      headers: req.headers,
    });
    return NextResponse.json(config);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to retrieve agent configuration" },
      { status: 500 },
    );
  }
}
