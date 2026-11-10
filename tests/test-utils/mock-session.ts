import { spyOn } from "bun:test";
import * as authHelper from "@/actions/auth-helper";

/**
 * Stands in for a signed-in session. Server Actions only trust
 * resolveActionUserId(), so tests mock that instead of a real cookie.
 * Call `.mockRestore()` on the result to go back to "no session".
 */
export function mockSessionUser(userId: string) {
  return spyOn(authHelper, "resolveActionUserId").mockResolvedValue(userId);
}
