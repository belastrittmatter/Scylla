import { describe, expect, test } from "bun:test";
import { resolveTokenScopes } from "@/services/agent";

describe("MCP OAuth scope resolution (#99)", () => {
  test("token scopes are intersected with consent, never widened", () => {
    expect(
      resolveTokenScopes(
        ["tasks.readonly"],
        ["tasks.readonly", "tasks.write", "teams.manage"],
      ),
    ).toEqual(["tasks.readonly"]);
    expect(
      resolveTokenScopes(["tasks.readonly", "tasks.write"], ["tasks.readonly"]),
    ).toEqual(["tasks.readonly"]);
  });

  test("falls back to consent only when the token carries no scopes", () => {
    expect(resolveTokenScopes([], ["calendar.readonly"])).toEqual([
      "calendar.readonly",
    ]);
    expect(resolveTokenScopes(["tasks.write"], undefined)).toEqual([
      "tasks.write",
    ]);
    expect(resolveTokenScopes([], undefined)).toEqual([]);
  });
});
