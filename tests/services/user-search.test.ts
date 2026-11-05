import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { db } from "@/db";
import { UserService } from "@/services/user";
import { GoogleCalendarService } from "@/services/google-calendar";

const emptyChain = {
  from: () => emptyChain,
  where: () => emptyChain,
  limit: async () => [],
};

function stubEmptyDatabase(): void {
  spyOn(db, "select").mockReturnValue(emptyChain as never);
}

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
    stubEmptyDatabase();
    stubDirectory([
      { id: "1", name: "Unrelated Person", email: "unrelated@example.com" },
      { id: "2", name: "Test User", email: "test.user@" },
    ]);

    const results = await UserService.searchTeammates("test.user@");

    expect(results).toEqual([]);
  });

  test("a complete email returns exactly one synthetic direct-email entry", async () => {
    stubEmptyDatabase();
    stubDirectory([]);

    const results = await UserService.searchTeammates("test.user@example.com");

    expect(results).toHaveLength(1);
    expect(results[0]?.email).toBe("test.user@example.com");
  });

  test("a name query keeps only directory users that match", async () => {
    stubEmptyDatabase();
    stubDirectory([
      { id: "1", name: "Alex Rivera", email: "alex@example.com" },
      { id: "2", name: "Someone Else", email: "someone@example.com" },
    ]);

    const results = await UserService.searchTeammates("alex");

    expect(results.map((u) => u.email)).toEqual(["alex@example.com"]);
  });
});
