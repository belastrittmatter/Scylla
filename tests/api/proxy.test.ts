import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { auth } from "@/lib/auth";

const ROOT_DIR = process.cwd();

describe("Proxy Authentication and Authorization", () => {
  it("redirects unauthenticated access to /calendar to /auth/sign-in", async () => {
    const req = new NextRequest("http://localhost:3000/calendar");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/auth/sign-in?callbackUrl=%2Fcalendar");
  });

  it("redirects authenticated users on /, /auth/sign-in, /auth/sign-up, and /sign-in to /calendar", async () => {
    const originalGetSession = auth.api.getSession;
    (auth.api as { getSession: typeof auth.api.getSession }).getSession =
      (async () =>
        ({ user: { id: "user-1" } }) as Awaited<
          ReturnType<typeof originalGetSession>
        >) as typeof auth.api.getSession;

    try {
      for (const path of ["/", "/auth/sign-in", "/auth/sign-up", "/sign-in"]) {
        const req = new NextRequest(`http://localhost:3000${path}`, {
          headers: {
            cookie: "better-auth.session_token=valid-session-token",
          },
        });
        const res = await proxy(req);

        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toBe("http://localhost:3000/calendar");
      }
    } finally {
      (auth.api as { getSession: typeof auth.api.getSession }).getSession =
        originalGetSession;
    }
  });

  it("redirects unauthenticated legacy /sign-in to canonical /auth/sign-in preserving query params", async () => {
    const req = new NextRequest(
      "http://localhost:3000/sign-in?callbackUrl=%2Ftasks",
    );
    const res = await proxy(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBe(
      "http://localhost:3000/auth/sign-in?callbackUrl=%2Ftasks",
    );
  });

  it("routes in-app navigation and post-authentication redirects to /calendar instead of /", () => {
    const authProvider = readFileSync(
      join(ROOT_DIR, "src/components/auth-provider.tsx"),
      "utf8",
    );
    expect(authProvider).toContain('redirectTo="/calendar"');
    expect(authProvider).not.toContain('redirectTo="/"');

    const authResult = readFileSync(
      join(ROOT_DIR, "src/components/auth/auth-result.tsx"),
      "utf8",
    );
    expect(authResult).toContain('result.redirectTo ?? "/calendar"');

    const viewHeader = readFileSync(
      join(ROOT_DIR, "src/components/layout/view-header.tsx"),
      "utf8",
    );
    expect(viewHeader).toContain('render={<Link href="/calendar" />}');
    expect(viewHeader).not.toContain('render={<Link href="/" />}');

    const appSidebar = readFileSync(
      join(ROOT_DIR, "src/components/layout/app-sidebar.tsx"),
      "utf8",
    );
    expect(appSidebar).toContain('href="/calendar"');
    expect(appSidebar).not.toContain('href="/"');

    const consentFilePath = existsSync(
      join(ROOT_DIR, "src/components/consent/use-consent-form.ts"),
    )
      ? join(ROOT_DIR, "src/components/consent/use-consent-form.ts")
      : join(ROOT_DIR, "src/app/consent/page.tsx");
    const consentContent = readFileSync(consentFilePath, "utf8");
    expect(consentContent).toContain('router.push("/calendar")');
    expect(consentContent).not.toContain('router.push("/")');
  });

  it("redirects unauthenticated access to /account/settings to /auth/sign-in", async () => {
    const req = new NextRequest("http://localhost:3000/account/settings");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain(
      "/auth/sign-in?callbackUrl=%2Faccount%2Fsettings",
    );
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

  it("does not redirect to / from /auth/sign-in when session token is invalid or expired", async () => {
    const req = new NextRequest("http://localhost:3000/auth/sign-in", {
      headers: {
        cookie: "better-auth.session_token=stale-or-invalid-token",
      },
    });
    const res = await proxy(req);

    // Should proceed to sign-in page, not redirect to /
    expect(res.status).toBe(200);
  });

  it("allows unauthenticated access to / without redirecting", async () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it("does not redirect to /calendar from / when session token is invalid or expired", async () => {
    const originalGetSession = auth.api.getSession;
    (auth.api as { getSession: typeof auth.api.getSession }).getSession =
      (async () => null) as unknown as typeof auth.api.getSession;

    try {
      const req = new NextRequest("http://localhost:3000/", {
        headers: {
          cookie: "better-auth.session_token=stale-or-invalid-token",
        },
      });
      const res = await proxy(req);

      // Should render landing page without redirect
      expect(res.status).toBe(200);
    } finally {
      (auth.api as { getSession: typeof auth.api.getSession }).getSession =
        originalGetSession;
    }
  });

  it("does not redirect to /calendar from / when session verification throws an error", async () => {
    const originalGetSession = auth.api.getSession;
    (auth.api as { getSession: typeof auth.api.getSession }).getSession =
      (async () => {
        throw new Error("verification failed");
      }) as unknown as typeof auth.api.getSession;

    try {
      const req = new NextRequest("http://localhost:3000/", {
        headers: {
          cookie: "better-auth.session_token=stale-or-invalid-token",
        },
      });
      const res = await proxy(req);

      // Should render landing page without redirect or error loop
      expect(res.status).toBe(200);
    } finally {
      (auth.api as { getSession: typeof auth.api.getSession }).getSession =
        originalGetSession;
    }
  });
});
