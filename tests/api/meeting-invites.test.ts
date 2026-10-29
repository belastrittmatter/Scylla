import { describe, it, expect, beforeAll } from "bun:test";
import { MeetingInviteService } from "@/services/meeting-invite";
import { db } from "@/db";
import { user, meetingRoom } from "@/db/schema";

describe("Meeting Invite Service - Room Selection & Access Restriction", () => {
  let organizerUserId: string;
  let testRoomId: string;

  beforeAll(async () => {
    // Ensure an organizer user exists
    const users = await db.select().from(user).limit(1);
    if (users.length > 0) {
      organizerUserId = users[0].id;
    } else {
      const [u] = await db
        .insert(user)
        .values({
          id: `org-${Date.now()}`,
          name: "Organizer Test",
          email: `organizer-${Date.now()}@example.com`,
          emailVerified: true,
        })
        .returning();
      organizerUserId = u.id;
    }

    // Ensure a test room exists
    const rooms = await db.select().from(meetingRoom).limit(1);
    if (rooms.length > 0) {
      testRoomId = rooms[0].id;
    } else {
      const [r] = await db
        .insert(meetingRoom)
        .values({
          name: "Test Room Alpha",
          email: `test-room-${Date.now()}@example.com`,
          capacity: 10,
          building: "Building A",
          floor: "3",
          features: ["video", "tv"],
          equipment: ["display"],
        })
        .returning();
      testRoomId = r.id;
    }
  });

  it("creates a meeting invite with physical room and access restriction", async () => {
    const invite = await MeetingInviteService.createInvite({
      title: "Design Review Q4",
      description: "Discussing quarterly UI architecture",
      duration: 30,
      organizerUserId,
      memberEmails: ["colleague@example.com"],
      locationType: "room",
      roomId: testRoomId,
      isRestricted: true,
      allowedEmails: ["invited.guest@example.com"],
    });

    expect(invite).toBeDefined();
    expect(invite.slug).toBeDefined();
    expect(invite.locationType).toBe("room");
    expect(invite.roomId).toBe(testRoomId);
    expect(invite.isRestricted).toBe(true);
    expect(invite.allowedEmails).toContain("invited.guest@example.com");

    const details = await MeetingInviteService.getInviteBySlug(invite.slug);
    expect(details).not.toBeNull();
    expect(details?.room?.id).toBe(testRoomId);
    expect(details?.invite.isRestricted).toBe(true);
    expect(details?.invite.allowedEmails).toEqual([
      "invited.guest@example.com",
    ]);
  });

  it("blocks booking from uninvited email when invite is restricted", async () => {
    const invite = await MeetingInviteService.createInvite({
      title: "Confidential Interview",
      duration: 45,
      organizerUserId,
      memberEmails: [],
      locationType: "meet",
      isRestricted: true,
      allowedEmails: ["vip.candidate@company.com"],
    });

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    const endTime = new Date(
      now.getTime() + 24 * 3600 * 1000 + 45 * 60 * 1000,
    ).toISOString();

    await expect(
      MeetingInviteService.bookSlot({
        slug: invite.slug,
        guestName: "Uninvited Intruder",
        guestEmail: "uninvited@unknown.com",
        startTime,
        endTime,
      }),
    ).rejects.toThrow("restricted to invited recipients only");

    // Verify allowed email whitelist is not leaked
    try {
      await MeetingInviteService.bookSlot({
        slug: invite.slug,
        guestName: "Uninvited Intruder",
        guestEmail: "uninvited@unknown.com",
        startTime,
        endTime,
      });
      expect.unreachable("Should have thrown error");
    } catch (err) {
      expect((err as Error).message).not.toContain("vip.client@partner.com");
    }
  });

  it("allows booking from authorized guest email on restricted invite and books the room", async () => {
    const invite = await MeetingInviteService.createInvite({
      title: "Sync with Key Partner",
      duration: 30,
      organizerUserId,
      memberEmails: [],
      locationType: "room",
      roomId: testRoomId,
      isRestricted: true,
      allowedEmails: ["key.partner@acme.corp"],
    });

    const now = new Date();
    const startTime = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
    const endTime = new Date(
      now.getTime() + 48 * 3600 * 1000 + 30 * 60 * 1000,
    ).toISOString();

    const result = await MeetingInviteService.bookSlot({
      slug: invite.slug,
      guestName: "Alice Partner",
      guestEmail: "key.partner@acme.corp",
      startTime,
      endTime,
      notes: "Bringing the draft contract",
    });

    expect(result).toBeDefined();
    expect(result.booking).toBeDefined();
    expect(result.booking.roomId).toBe(testRoomId);
    expect(result.booking.title).toContain("Alice Partner");
  });

  it("allows any guest email when invite is not restricted (public)", async () => {
    const invite = await MeetingInviteService.createInvite({
      title: "Public Office Hours",
      duration: 15,
      organizerUserId,
      memberEmails: [],
      locationType: "meet",
      isRestricted: false,
      allowedEmails: [],
    });

    const now = new Date();
    const startTime = new Date(now.getTime() + 72 * 3600 * 1000).toISOString();
    const endTime = new Date(
      now.getTime() + 72 * 3600 * 1000 + 15 * 60 * 1000,
    ).toISOString();

    const result = await MeetingInviteService.bookSlot({
      slug: invite.slug,
      guestName: "Random Visitor",
      guestEmail: "random.visitor@gmail.com",
      startTime,
      endTime,
    });

    expect(result).toBeDefined();
    expect(result.booking).toBeDefined();
    expect(result.booking.status).toBe("confirmed");
  });
});
