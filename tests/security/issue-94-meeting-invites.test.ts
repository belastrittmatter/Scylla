import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
  afterEach,
  spyOn,
} from "bun:test";
import { POST as createInviteHandler } from "@/app/api/meeting-invites/route";
import { GET as getInviteHandler } from "@/app/api/meeting-invites/[slug]/route";
import { POST as bookHandler } from "@/app/api/meeting-invites/[slug]/book/route";
import { POST as slotsHandler } from "@/app/api/meeting-invites/[slug]/slots/route";
import { MeetingInviteService } from "@/services/meeting-invite";
import { GoogleCalendarService } from "@/services/google-calendar";
import type { TimeSlot } from "@/services/scheduler";
import { db } from "@/db";
import {
  user,
  account,
  meetingInvite,
  meetingRoom,
  booking,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const RUN = Date.now();
const ORGANIZER_EMAIL = `test-org-94-${RUN}@example.com`;
const MEMBER_USER_EMAIL = `member-user-94-${RUN}@example.com`;
const SECRET_MEMBER = `internal-secret-${RUN}@company.com`;
const SECRET_GUEST = `vip-client-${RUN}@confidential.com`;
const ROOM_EMAIL = `room-94-${RUN}@resource.example.com`;
const SECRETS = [
  ORGANIZER_EMAIL,
  MEMBER_USER_EMAIL,
  SECRET_MEMBER,
  SECRET_GUEST,
  ROOM_EMAIL,
];

function expectNoSecrets(body: unknown) {
  const text = JSON.stringify(body).toLowerCase();
  for (const secret of SECRETS) {
    expect(text).not.toContain(secret.toLowerCase());
  }
}

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

function bookRequest(slug: string, body: unknown) {
  return bookHandler(
    new Request(`http://localhost:3000/api/meeting-invites/${slug}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params(slug),
  );
}

function slotsRequest(slug: string, body: unknown) {
  return slotsHandler(
    new Request(`http://localhost:3000/api/meeting-invites/${slug}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params(slug),
  );
}

/** Returns slots the invite actually offers on the first weekday with enough room. */
async function offeredSlots(slug: string): Promise<TimeSlot[]> {
  for (let d = 7; d < 21; d++) {
    const date = new Date(Date.now() + d * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const slots = await MeetingInviteService.getAvailableSlots(slug, date);
    if (slots.length >= 4) return slots;
  }
  throw new Error("no offered slots found");
}

describe("Security Issue #94: Meeting Invites Hardening", () => {
  let testOrganizerId: string;
  let memberUserId: string;
  let roomId: string;

  beforeAll(async () => {
    testOrganizerId = `test-org-94-${RUN}`;
    memberUserId = `test-member-94-${RUN}`;
    await db.insert(user).values([
      {
        id: testOrganizerId,
        name: "Test Organizer 94",
        email: ORGANIZER_EMAIL,
      },
      { id: memberUserId, name: "Member User 94", email: MEMBER_USER_EMAIL },
    ]);
    const [room] = await db
      .insert(meetingRoom)
      .values({ name: `Room 94 ${RUN}`, email: ROOM_EMAIL, capacity: 4 })
      .returning();
    roomId = room.id;
  });

  afterEach(async () => {
    await db
      .delete(meetingInvite)
      .where(eq(meetingInvite.organizerUserId, testOrganizerId));
    await db
      .delete(booking)
      .where(eq(booking.organizerUserId, testOrganizerId));
  });

  afterAll(async () => {
    await db.delete(meetingRoom).where(eq(meetingRoom.id, roomId));
    await db.delete(user).where(eq(user.id, testOrganizerId));
    await db.delete(user).where(eq(user.id, memberUserId));
  });

  const createSecretInvite = (overrides = {}) =>
    MeetingInviteService.createInvite({
      title: "Confidential Strategy Session",
      duration: 30,
      organizerUserId: testOrganizerId,
      memberEmails: [MEMBER_USER_EMAIL, SECRET_MEMBER],
      locationType: "room",
      roomId,
      isRestricted: true,
      allowedEmails: [SECRET_GUEST],
      ...overrides,
    });

  it("POST /api/meeting-invites rejects unauthenticated requests with 401", async () => {
    const req = new Request("http://localhost:3000/api/meeting-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Impersonated Meeting",
        organizerUserId: testOrganizerId,
      }),
    });

    const res = await createInviteHandler(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/meeting-invites/[slug] exposes no emails, user ids or room email", async () => {
    const invite = await createSecretInvite();

    const res = await getInviteHandler(
      new Request(`http://localhost:3000/api/meeting-invites/${invite.slug}`),
      params(invite.slug),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expectNoSecrets(data);
    expect(JSON.stringify(data)).not.toContain(testOrganizerId);
    expect(JSON.stringify(data)).not.toContain(memberUserId);
    expect(data.invite.organizerUserId).toBeUndefined();
    expect(data.room.email).toBeUndefined();
    expect(data.members).toHaveLength(2);
    expect(data.members.map((m: { name: string }) => m.name)).toContain(
      "Member User 94",
    );
  });

  it("POST /book returns only the public projection and ignores organizerUserId in the body", async () => {
    const invite = await createSecretInvite();
    const [slot] = await offeredSlots(invite.slug);

    const res = await bookRequest(invite.slug, {
      guestName: "VIP",
      guestEmail: SECRET_GUEST,
      startTime: slot.start,
      endTime: slot.end,
      organizerUserId: memberUserId,
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expectNoSecrets(data);
    expect(data.booking.attendees).toBeUndefined();
    expect(data.invite.organizerUserId).toBeUndefined();
    expect(data.booking.startTime).toBeDefined();

    const [row] = await db
      .select()
      .from(booking)
      .where(eq(booking.id, data.booking.id));
    expect(row.organizerUserId).toBe(testOrganizerId);
    expect(row.roomId).toBe(roomId);
  });

  it("POST /book rejects a restricted invite for an uninvited email with 403", async () => {
    const invite = await createSecretInvite();
    const [slot] = await offeredSlots(invite.slug);

    const res = await bookRequest(invite.slug, {
      guestName: "Intruder",
      guestEmail: "intruder@unknown.com",
      startTime: slot.start,
      endTime: slot.end,
    });

    expect(res.status).toBe(403);
    expectNoSecrets(await res.json());
  });

  it("POST /book validates the body and maps unknown slugs to 404", async () => {
    const invite = await createSecretInvite({ isRestricted: false });

    const bad = await bookRequest(invite.slug, {
      guestName: "X",
      guestEmail: "not-an-email",
      startTime: "tomorrow",
      endTime: "later",
    });
    expect(bad.status).toBe(400);

    const [slot] = await offeredSlots(invite.slug);
    const missing = await bookRequest(`missing-${RUN}`, {
      guestName: "X",
      guestEmail: "x@example.com",
      startTime: slot.start,
      endTime: slot.end,
    });
    expect(missing.status).toBe(404);
  });

  it("slots endpoint validates date and timeZone and maps unknown slugs to 404", async () => {
    const invite = await createSecretInvite();

    expect(
      (await slotsRequest(invite.slug, { date: "2026-13-45" })).status,
    ).toBe(400);
    expect(
      (await slotsRequest(invite.slug, { date: "2026-02-30" })).status,
    ).toBe(400);
    expect(
      (
        await slotsRequest(invite.slug, {
          date: "2026-12-01",
          timeZone: "Mars/Base",
        })
      ).status,
    ).toBe(400);
    expect(
      (await slotsRequest(`missing-${RUN}`, { date: "2026-12-01" })).status,
    ).toBe(404);
  });

  it("bookSlot rejects booking with mismatched duration", async () => {
    const invite = await createSecretInvite({ isRestricted: false });
    const [slot] = await offeredSlots(invite.slug);
    const endTime = new Date(
      new Date(slot.start).getTime() + 60 * 60 * 1000,
    ).toISOString();

    await expect(
      MeetingInviteService.bookSlot({
        slug: invite.slug,
        guestName: "Guest User",
        guestEmail: "guest@example.com",
        startTime: slot.start,
        endTime,
      }),
    ).rejects.toThrow("duration");
  });

  it("bookSlot rejects booking slots in the past", async () => {
    const invite = await createSecretInvite({ isRestricted: false });

    await expect(
      MeetingInviteService.bookSlot({
        slug: invite.slug,
        guestName: "Time Traveler",
        guestEmail: "traveler@example.com",
        startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
        endTime: new Date(Date.now() - 1800 * 1000).toISOString(),
      }),
    ).rejects.toThrow("past");
  });

  it("bookSlot rejects a time the invite does not offer", async () => {
    const invite = await createSecretInvite({ isRestricted: false });
    const [slot] = await offeredSlots(invite.slug);
    // 7 minutes past an offered slot start: right length, but never offered
    const start = new Date(new Date(slot.start).getTime() + 7 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const res = await bookRequest(invite.slug, {
      guestName: "Off Grid",
      guestEmail: "off@example.com",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    expect(res.status).toBe(409);

    const rows = await db
      .select()
      .from(booking)
      .where(eq(booking.organizerUserId, testOrganizerId));
    expect(rows).toHaveLength(0);
  });

  it("allows back-to-back bookings and rejects overlapping ones across invites", async () => {
    const a = await createSecretInvite({ isRestricted: false });
    const b = await createSecretInvite({ isRestricted: false });
    const slots = await offeredSlots(a.slug);
    const first = slots[0];
    const adjacent = slots.find((s) => s.start === first.end)!;
    expect(adjacent).toBeDefined();

    const guest = { guestName: "G", guestEmail: "g@example.com" };
    await MeetingInviteService.bookSlot({
      slug: a.slug,
      ...guest,
      startTime: first.start,
      endTime: first.end,
    });
    await MeetingInviteService.bookSlot({
      slug: b.slug,
      ...guest,
      startTime: adjacent.start,
      endTime: adjacent.end,
    });

    const overlap = await bookRequest(b.slug, {
      ...guest,
      startTime: first.start,
      endTime: first.end,
    });
    expect(overlap.status).toBe(409);
  });

  it("keeps shareable links reusable for different slots", async () => {
    const invite = await createSecretInvite({ isRestricted: false });
    const slots = await offeredSlots(invite.slug);
    const guest = { guestName: "G", guestEmail: "g@example.com" };

    await MeetingInviteService.bookSlot({
      slug: invite.slug,
      ...guest,
      startTime: slots[0].start,
      endTime: slots[0].end,
    });
    const second = await MeetingInviteService.bookSlot({
      slug: invite.slug,
      ...guest,
      startTime: slots[3].start,
      endTime: slots[3].end,
    });
    expect(second.booking.id).toBeDefined();

    const [row] = await db
      .select()
      .from(meetingInvite)
      .where(eq(meetingInvite.id, invite.id));
    expect(row.isActive).toBe(true);
  });

  it("concurrent bookings of the same slot across invites: exactly one wins", async () => {
    const a = await createSecretInvite({ isRestricted: false });
    const b = await createSecretInvite({ isRestricted: false });
    const [slot] = await offeredSlots(a.slug);
    const guest = {
      guestName: "G",
      guestEmail: "g@example.com",
      startTime: slot.start,
      endTime: slot.end,
    };

    const results = await Promise.allSettled([
      MeetingInviteService.bookSlot({ slug: a.slug, ...guest }),
      MeetingInviteService.bookSlot({ slug: b.slug, ...guest }),
      MeetingInviteService.bookSlot({ slug: a.slug, ...guest }),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rows = await db
      .select()
      .from(booking)
      .where(eq(booking.organizerUserId, testOrganizerId));
    expect(rows).toHaveLength(1);
  });

  it("invite slots and bookings respect the organizer's Google busy times", async () => {
    await db.insert(account).values({
      id: `acc_${testOrganizerId}`,
      accountId: testOrganizerId,
      providerId: "google",
      userId: testOrganizerId,
      accessToken: "org-94-token",
      updatedAt: new Date(),
    });
    const freeBusy = spyOn(GoogleCalendarService, "getFreeBusy");
    try {
      freeBusy.mockResolvedValue({});
      const invite = await createSecretInvite();
      const [slot] = await offeredSlots(invite.slug);
      expect(freeBusy).toHaveBeenCalledWith(
        expect.arrayContaining([ORGANIZER_EMAIL.toLowerCase()]),
        expect.any(Date),
        expect.any(Date),
        expect.objectContaining({
          accountRecord: expect.objectContaining({ userId: testOrganizerId }),
        }),
      );

      // The organizer's Google calendar now has the first offered slot busy.
      const slotStart = new Date(slot.start).getTime();
      freeBusy.mockResolvedValue({
        [ORGANIZER_EMAIL.toLowerCase()]: [
          {
            start: new Date(slot.start).toISOString(),
            end: new Date(slot.end).toISOString(),
          },
        ],
      });
      const after = await offeredSlots(invite.slug);
      expect(after.some((s) => new Date(s.start).getTime() === slotStart)).toBe(
        false,
      );

      const res = await bookRequest(invite.slug, {
        guestName: "VIP",
        guestEmail: SECRET_GUEST,
        startTime: slot.start,
        endTime: slot.end,
      });
      expect(res.status).toBe(409);
    } finally {
      freeBusy.mockRestore();
      await db.delete(account).where(eq(account.id, `acc_${testOrganizerId}`));
    }
  });
});
