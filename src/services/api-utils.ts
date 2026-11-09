import { auth } from "@/lib/auth";
import { db, account, user } from "@/db";
import { eq } from "drizzle-orm";

export async function resolveUserId(
  req: Request,
  explicitId?: string | null,
): Promise<string | undefined> {
  let sessionUserId: string | undefined;
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    sessionUserId = session?.user?.id;
  } catch {
    // ignore session resolution errors
  }

  if (!sessionUserId) {
    try {
      const { headers } = await import("next/headers");
      const reqHeaders = await headers();
      const session = await auth.api.getSession({ headers: reqHeaders });
      sessionUserId = session?.user?.id;
    } catch {
      // ignore
    }
  }

  // Hard-bind to authenticated session user ID to prevent caller spoofing
  if (sessionUserId) {
    return sessionUserId;
  }

  // In test environment, strictly require session, x-user-id, or explicitId
  if (process.env.NODE_ENV === "test") {
    const testHeaderUser = req.headers.get("x-user-id");
    if (testHeaderUser) return testHeaderUser;
    if (explicitId && explicitId !== "me") {
      return explicitId;
    }
    return undefined;
  }

  // In development environment, permit test headers or fallback to dev user
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === undefined
  ) {
    const testHeaderUser = req.headers.get("x-user-id");
    if (testHeaderUser) return testHeaderUser;
    if (explicitId && explicitId !== "me") {
      return explicitId;
    }

    try {
      const [ghAccount] = await db
        .select({ userId: account.userId })
        .from(account)
        .where(eq(account.providerId, "github"))
        .limit(1);
      if (ghAccount?.userId) return ghAccount.userId;

      const [firstUser] = await db.select({ id: user.id }).from(user).limit(1);
      if (firstUser?.id) return firstUser.id;
    } catch {
      // ignore db errors
    }
  }

  return undefined;
}

export function isUniqueConstraintError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as {
    code?: string;
    message?: string;
    cause?: {
      code?: string;
      message?: string;
      detail?: string;
      constraint?: string;
    };
  };
  return (
    anyErr.code === "23505" ||
    anyErr.cause?.code === "23505" ||
    Boolean(
      anyErr.message &&
      (anyErr.message.includes("unique constraint") ||
        anyErr.message.includes("duplicate key")),
    ) ||
    Boolean(
      anyErr.cause?.message &&
      (anyErr.cause.message.includes("unique constraint") ||
        anyErr.cause.message.includes("duplicate key")),
    ) ||
    Boolean(
      anyErr.cause?.detail && anyErr.cause.detail.includes("already exists"),
    ) ||
    Boolean(
      anyErr.cause?.constraint && anyErr.cause.constraint.includes("unique"),
    )
  );
}
