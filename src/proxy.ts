import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "@/lib/auth";

const PROTECTED_PAGE_PREFIXES = [
  "/calendar",
  "/projects",
  "/teams",
  "/tasks",
  "/timeline",
  "/settings",
  "/support",
];

const PROTECTED_API_PREFIXES = [
  "/api/calendar",
  "/api/rooms",
  "/api/users",
  "/api/slots",
  "/api/event-types",
  "/api/tasks",
  "/api/projects",
  "/api/teams",
  "/api/bookings",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // 1. Check protected dashboard pages under (auth)
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtectedPage && !sessionCookie) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Block protected API routes when no valid session is present
  const isProtectedApi = PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtectedApi && !sessionCookie) {
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // 3. Redirect authenticated users away from sign-in / sign-up pages to /calendar
  if (
    sessionCookie &&
    (pathname === "/auth/sign-in" ||
      pathname === "/auth/sign-up" ||
      pathname === "/sign-in")
  ) {
    return NextResponse.redirect(new URL("/calendar", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset extensions (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|css|js|mp4|webm)$).*)",
  ],
};
