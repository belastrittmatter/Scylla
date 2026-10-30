import { GET as searchUsersHandler } from "@/app/api/users/search/route";
import { GET as getRoomsHandler } from "@/app/api/rooms/route";
import { POST as syncRoomsHandler } from "@/app/api/rooms/sync/route";
import { POST as findSlotsHandler } from "@/app/api/slots/find/route";
import { GET as getAgendaHandler } from "@/app/api/bookings/agenda/route";
import { POST as createBookingHandler } from "@/app/api/bookings/route";
import {
  PATCH as rescheduleBookingHandler,
  DELETE as cancelBookingHandler,
} from "@/app/api/bookings/[id]/route";
import { GET as getEventTypesHandler } from "@/app/api/event-types/route";
import { GET as getCalendarHandler } from "@/app/api/calendar/route";
import {
  isGoogleApiUrl,
  handleMockGoogleRequest,
} from "@/utils/mock-google-calendar";

export function setupMockFetchRouter() {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    let urlStr: string;
    let signal: AbortSignal | undefined = init?.signal;

    if (typeof input === "string") {
      urlStr = input;
    } else if (input instanceof URL) {
      urlStr = input.toString();
    } else {
      urlStr = input.url;
      signal = signal || input.signal;
    }

    if (signal?.aborted) {
      throw new DOMException("The user aborted a request.", "AbortError");
    }

    if (isGoogleApiUrl(urlStr)) {
      return handleMockGoogleRequest(urlStr, init);
    }

    const url = new URL(urlStr, "http://localhost:3000");
    const pathname = url.pathname;
    const method = (
      init?.method ||
      (typeof input === "object" && "method" in input ? input.method : "GET") ||
      "GET"
    ).toUpperCase();

    // Only intercept requests aimed at /api
    if (!pathname.startsWith("/api/")) {
      return originalFetch(input, init);
    }

    const req = new Request(urlStr, init);

    try {
      if (pathname === "/api/users/search") {
        return await searchUsersHandler(req);
      }
      if (pathname === "/api/rooms/sync") {
        return await syncRoomsHandler(req);
      }
      if (pathname === "/api/rooms") {
        return await getRoomsHandler(req);
      }
      if (pathname === "/api/slots/find") {
        return await findSlotsHandler(req);
      }
      if (pathname === "/api/bookings/agenda") {
        return await getAgendaHandler(req);
      }
      if (pathname === "/api/bookings") {
        return await createBookingHandler(req);
      }
      if (pathname.startsWith("/api/bookings/")) {
        const id = pathname.slice("/api/bookings/".length);
        if (method === "PATCH") {
          return await rescheduleBookingHandler(req, {
            params: Promise.resolve({ id }),
          });
        }
        if (method === "DELETE") {
          return await cancelBookingHandler(req, {
            params: Promise.resolve({ id }),
          });
        }
      }
      if (pathname === "/api/event-types") {
        return await getEventTypesHandler(req);
      }
      if (pathname === "/api/calendar") {
        return await getCalendarHandler(req);
      }
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      );
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}
