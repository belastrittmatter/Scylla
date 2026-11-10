import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { eq } from "drizzle-orm";
import {
  findSlotsAction,
  getRoomsAction,
  searchTeammatesAction,
} from "@/actions";
import { db } from "@/db";
import { account, user } from "@/db/schema";
import { RoomService } from "@/services/rooms";
import { SchedulerService } from "@/services/scheduler";
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

  test("findSlotsAction passes the caller's Google account (#96)", async () => {
    const find = spyOn(SchedulerService, "findSlots").mockResolvedValue([]);
    spies.push(find);
    await findSlotsAction({
      attendees: [`${userId}@example.com`],
      durationMinutes: 30,
      startDate: new Date(Date.now() + 86_400_000).toISOString(),
      endDate: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "scope-token",
        accountRecord: expect.objectContaining({ userId }),
      }),
    );
  });

  test("findSlotsAction rejects attendees who are not teammates (#96)", async () => {
    const find = spyOn(SchedulerService, "findSlots").mockResolvedValue([]);
    find.mockClear();
    spies.push(find);
    const result = await findSlotsAction({
      attendees: ["outsider@other-tenant.test"],
      durationMinutes: 30,
      startDate: new Date(Date.now() + 86_400_000).toISOString(),
      endDate: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    });
    expect(result.success).toBe(false);
    expect(find).not.toHaveBeenCalled();
  });
});
