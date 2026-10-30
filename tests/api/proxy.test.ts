import { describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("Proxy Authentication and Authorization", () => {
  it("redirects unauthenticated access to /timeline to /auth/sign-in", async () => {
    const req = new NextRequest("http://localhost:3000/timeline");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/auth/sign-in?callbackUrl=%2Ftimeline");
  });

  it("blocks unauthenticated access to /api/bookings with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/bookings");
    const res = await proxy(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("does NOT bypass auth when x-bypass-auth header is present", async () => {
    const req = new NextRequest("http://localhost:3000/api/bookings", {
      headers: {
        "x-bypass-auth": "true",
      },
    });
    const res = await proxy(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("does NOT bypass auth when arbitrary unvalidated authorization header is present", async () => {
    const req = new NextRequest("http://localhost:3000/api/calendar", {
      headers: {
        authorization: "Bearer invalid-or-fake-token",
      },
    });
    const res = await proxy(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("allows access to public pages without session", async () => {
    const req = new NextRequest("http://localhost:3000/book/some-slug");
    const res = await proxy(req);

    // NextResponse.next() returns 200 by default in NextRequest handling
    expect(res.status).toBe(200);
  });
});
