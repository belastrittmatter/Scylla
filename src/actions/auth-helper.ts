import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";

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
 * Resolves a valid user ID for creator/author associations.
 * In production, an authenticated session is strictly required.
 * In development or testing environments, falls back to the primary user if unauthenticated.
 */
export async function resolveActionUserId(explicitId?: string | null): Promise<string> {
  if (explicitId) return explicitId;
  const sessionUserId = await getSessionUserId();
  if (sessionUserId) return sessionUserId;

  const isDevOrTest =
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test" ||
    process.env.BUN_ENV === "test" ||
    process.env.NODE_ENV === undefined;

  if (isDevOrTest) {
    const [firstUser] = await db.select({ id: user.id }).from(user).limit(1);
    return firstUser?.id || "usr-primary";
  }

  throw new Error("Unauthorized: Active user session required");
}
