import { auth } from "@/lib/auth";

export async function resolveUserId(
  req: Request,
  explicitId?: string | null,
): Promise<string | undefined> {
  if (explicitId && explicitId !== "me") {
    return explicitId;
  }
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    return session?.user?.id;
  } catch {
    return undefined;
  }
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
