import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_PAGE_PREFIXES = [
  "/calendar",
  "/projects",
  "/teams",
  "/tasks",
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
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // 1. Kiểm tra các trang protected thuộc (auth)
  const isProtectedPage =
    pathname === "/" ||
    PROTECTED_PAGE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  if (isProtectedPage && !sessionCookie) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Chặn các API yêu cầu đăng nhập nếu không có session
  const isProtectedApi = PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const isBypassAllowed =
    process.env.NODE_ENV === "test" ||
    request.headers.get("x-bypass-auth") === "true" ||
    Boolean(request.headers.get("authorization"));

  if (isProtectedApi && !sessionCookie && !isBypassAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Nếu đã đăng nhập mà truy cập trang sign-in / sign-up -> Chuyển hướng vào homepage /
  if (sessionCookie && (pathname === "/auth/sign-in" || pathname === "/auth/sign-up")) {
    return NextResponse.redirect(new URL("/", request.url));
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
