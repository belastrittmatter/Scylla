import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";

// Keep the service off Postgres: the DB branch is exercised by other suites.
mock.module("@/db", () => {
  const empty = {
    from: () => empty,
    where: () => empty,
    limit: async () => [],
  };
  return { db: { select: () => empty }, user: {} };
});

import { UserService } from "@/services/user";
import { GoogleCalendarService } from "@/services/google-calendar";

function stubDirectory(
  users: Array<{ id: string; name: string; email: string }>,
): void {
  spyOn(GoogleCalendarService, "searchDirectoryUsers").mockResolvedValue(users);
}

describe("UserService.searchTeammates", () => {
  afterEach(() => {
    mock.restore();
  });

  test("an email fragment never expands to unrelated directory users", async () => {
    stubDirectory([
      { id: "1", name: "Unrelated Person", email: "unrelated@example.com" },
      { id: "2", name: "Test User", email: "test.user@" },
    ]);

    const results = await UserService.searchTeammates("test.user@");

    expect(results).toEqual([]);
  });

  test("a complete email returns exactly one synthetic direct-email entry", async () => {
    stubDirectory([]);

    const results = await UserService.searchTeammates("test.user@example.com");

    expect(results).toHaveLength(1);
    expect(results[0]?.email).toBe("test.user@example.com");
  });

  test("a name query keeps only directory users that match", async () => {
    stubDirectory([
      { id: "1", name: "Alex Rivera", email: "alex@example.com" },
      { id: "2", name: "Someone Else", email: "someone@example.com" },
    ]);

    const results = await UserService.searchTeammates("alex");

    expect(results.map((u) => u.email)).toEqual(["alex@example.com"]);
  });
});
