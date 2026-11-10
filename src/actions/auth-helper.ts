import { auth } from "@/lib/auth";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper to retrieve currently authenticated user ID from request session.
 * Safely handles calls outside of a Next.js request context (e.g. tests, CLI).
 */
export async function getSessionUserId(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * The signed-in user's ID. Server Actions must only trust the session, never
 * an ID sent by the client, so this throws when there is no session.
 */
export async function resolveActionUserId(): Promise<string> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    throw new Error("Unauthorized: Active user session required");
  }
  return sessionUserId;
}
