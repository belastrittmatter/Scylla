import { describe, expect, it } from "bun:test";
import { POST as createInviteHandler } from "@/app/api/meeting-invites/route";
import { GET as getInviteHandler } from "@/app/api/meeting-invites/[slug]/route";
import { MeetingInviteService } from "@/services/meeting-invite";
import { db } from "@/db";
import { user, meetingInvite, booking } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Security Issue #94: Meeting Invites Hardening", () => {
  it("POST /api/meeting-invites rejects unauthenticated requests with 401", async () => {
    const req = new Request("http://localhost:3000/api/meeting-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Impersonated Meeting",
        organizerUserId: "usr_alex_rivera",
      }),
    });

    const res = await createInviteHandler(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/meeting-invites/[slug] hides private attendee whitelist from public responses", async () => {
    const invite = await MeetingInviteService.createInvite({
      title: "Confidential Strategy Session",
      duration: 30,
      organizerUserId: "usr_alex_rivera",
      memberEmails: ["internal-secret@company.com"],
      isRestricted: true,
      allowedEmails: ["vip-client@confidential.com"],
    });

    const req = new Request(
      `http://localhost:3000/api/meeting-invites/${invite.slug}`,
    );
    const res = await getInviteHandler(req, {
      params: Promise.resolve({ slug: invite.slug }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.invite.allowedEmails).toBeUndefined();
    expect(data.invite.memberEmails).toBeUndefined();

    // Cleanup
    await db.delete(meetingInvite).where(eq(meetingInvite.id, invite.id));
  });

  it("bookSlot rejects booking with mismatched duration", async () => {
    const invite = await MeetingInviteService.createInvite({
      title: "Strict 30m Sync",
      duration: 30,
      organizerUserId: "usr_alex_rivera",
      memberEmails: [],
    });

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    // 60 minutes instead of 30 minutes
    const endTime = new Date(
      now.getTime() + 24 * 3600 * 1000 + 60 * 60 * 1000,
    ).toISOString();

    await expect(
      MeetingInviteService.bookSlot({
        slug: invite.slug,
        guestName: "Guest User",
        guestEmail: "guest@example.com",
        startTime,
        endTime,
      }),
    ).rejects.toThrow("duration");

    // Cleanup
    await db.delete(meetingInvite).where(eq(meetingInvite.id, invite.id));
  });

  it("bookSlot rejects booking slots in the past", async () => {
    const invite = await MeetingInviteService.createInvite({
      title: "Future Only Meeting",
      duration: 30,
      organizerUserId: "usr_alex_rivera",
      memberEmails: [],
    });

    const pastStart = new Date(Date.now() - 3600 * 1000).toISOString();
    const pastEnd = new Date(Date.now() - 1800 * 1000).toISOString();

    await expect(
      MeetingInviteService.bookSlot({
        slug: invite.slug,
        guestName: "Time Traveler",
        guestEmail: "traveler@example.com",
        startTime: pastStart,
        endTime: pastEnd,
      }),
    ).rejects.toThrow("past");

    // Cleanup
    await db.delete(meetingInvite).where(eq(meetingInvite.id, invite.id));
  });

  it("bookSlot prevents re-booking an already booked invite", async () => {
    const [testOrg] = await db
      .insert(user)
      .values({
        id: `org-test-${Date.now()}`,
        name: "Test Org",
        email: `org-${Date.now()}@example.com`,
      })
      .returning();

    const invite = await MeetingInviteService.createInvite({
      title: "Single Use Coffee Chat",
      duration: 30,
      organizerUserId: testOrg.id,
      memberEmails: [],
    });

    const now = new Date();
    const startTime = new Date(now.getTime() + 100 * 3600 * 1000).toISOString();
    const endTime = new Date(
      now.getTime() + 100 * 3600 * 1000 + 30 * 60 * 1000,
    ).toISOString();

    const firstBooking = await MeetingInviteService.bookSlot({
      slug: invite.slug,
      guestName: "First Guest",
      guestEmail: "first@example.com",
      startTime,
      endTime,
    });
    expect(firstBooking.booking).toBeDefined();

    // Attempt second booking on the same invite
    const nextStart = new Date(now.getTime() + 105 * 3600 * 1000).toISOString();
    const nextEnd = new Date(
      now.getTime() + 105 * 3600 * 1000 + 30 * 60 * 1000,
    ).toISOString();

    await expect(
      MeetingInviteService.bookSlot({
        slug: invite.slug,
        guestName: "Second Guest",
        guestEmail: "second@example.com",
        startTime: nextStart,
        endTime: nextEnd,
      }),
    ).rejects.toThrow();

    // Cleanup
    await db.delete(meetingInvite).where(eq(meetingInvite.id, invite.id));
    if (firstBooking.booking?.id) {
      await db.delete(booking).where(eq(booking.id, firstBooking.booking.id));
    }
    await db.delete(user).where(eq(user.id, testOrg.id));
  });
});
