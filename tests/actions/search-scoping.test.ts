import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { eq } from "drizzle-orm";
import { getRoomsAction, searchTeammatesAction } from "@/actions";
import { db } from "@/db";
import { account, user } from "@/db/schema";
import { RoomService } from "@/services/rooms";
import { UserService } from "@/services/user";
import { mockSessionUser } from "../test-utils/mock-session";

// Directory and room lookups must run with the caller's own Google account.
describe("search actions are scoped to the session user (#93)", () => {
  const userId = `usr_scope_${Date.now()}`;
  const spies: Array<{ mockRestore(): void }> = [];

  beforeAll(async () => {
    await db.insert(user).values({
      id: userId,
      name: "Scope User",
      email: `${userId}@example.com`,
    });
    await db.insert(account).values({
      id: `acc_${userId}`,
      accountId: userId,
      providerId: "google",
      userId,
      accessToken: "scope-token",
      updatedAt: new Date(),
    });
    spies.push(mockSessionUser(userId));
  });

  afterAll(async () => {
    spies.forEach((s) => s.mockRestore());
    await db.delete(user).where(eq(user.id, userId));
  });

  test("searchTeammatesAction passes the caller's Google account", async () => {
    const search = spyOn(UserService, "searchTeammates").mockResolvedValue([]);
    spies.push(search);
    await searchTeammatesAction("al");
    expect(search).toHaveBeenCalledWith(
      "al",
      20,
      expect.objectContaining({
        currentUserId: userId,
        accessToken: "scope-token",
      }),
    );
  });

  test("getRoomsAction passes the caller's Google account", async () => {
    const rooms = spyOn(RoomService, "listRooms").mockResolvedValue([]);
    spies.push(rooms);
    await getRoomsAction({});
    expect(rooms).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ accessToken: "scope-token" }),
    );
  });
});
