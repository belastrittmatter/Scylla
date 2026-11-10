import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { db } from "@/db";
import { UserService } from "@/services/user";
import { GoogleCalendarService } from "@/services/google-calendar";

const caller = { currentUserId: "usr_caller" };

// No DB users match the text search; `teammateEmails` are the caller's teammates.
function stubEmptyDatabase(teammateEmails: string[] = []): void {
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: async () => [],
    then: (resolve: (rows: Array<{ email: string }>) => unknown) =>
      resolve(teammateEmails.map((email) => ({ email }))),
  };
  spyOn(UserService, "getTeammateIds").mockResolvedValue(["usr_caller"]);
  spyOn(db, "select").mockReturnValue(chain as never);
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

    const results = await UserService.searchTeammates("test.user@", 20, caller);

    expect(results).toEqual([]);
  });

  test("a complete email returns exactly one synthetic direct-email entry", async () => {
    stubEmptyDatabase();
    stubDirectory([]);

    const results = await UserService.searchTeammates(
      "test.user@example.com",
      20,
      caller,
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.email).toBe("test.user@example.com");
  });

  test("a name query keeps only directory teammates that match", async () => {
    stubEmptyDatabase(["alex@example.com", "someone@example.com"]);
    stubDirectory([
      { id: "1", name: "Alex Rivera", email: "alex@example.com" },
      { id: "2", name: "Someone Else", email: "someone@example.com" },
    ]);

    const results = await UserService.searchTeammates("alex", 20, caller);

    expect(results.map((u) => u.email)).toEqual(["alex@example.com"]);
  });
});
