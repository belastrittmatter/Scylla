import { describe, it, expect, beforeEach } from "bun:test";
import { reconcileDeletedGoogleEvents } from "@/utils/calendar-sync-reconciler";
import { db } from "@/db";
import { booking, user } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Calendar Sync Reconciler", () => {
  let testUserId: string;

  beforeEach(async () => {
    // Ensure test user exists
    const existing = await db.query.user.findFirst();
    if (existing) {
      testUserId = existing.id;
    } else {
      const inserted = await db
        .insert(user)
        .values({
          id: `usr_${Date.now()}`,
          name: "Test User",
          email: `test_${Date.now()}@example.com`,
        })
        .returning();
      testUserId = inserted[0].id;
    }
  });

  it("marks confirmed bookings as cancelled when deleted on Google Calendar", async () => {
    const start = new Date("2026-10-22T10:00:00Z");
    const end = new Date("2026-10-22T11:00:00Z");

    const [b1] = await db
      .insert(booking)
      .values({
        title: "Meeting Deleted from Google",
        organizerUserId: testUserId,
        startTime: start,
        endTime: end,
        status: "confirmed",
        gcalEventId: "gcal_deleted_123",
      })
      .returning();

    const [b2] = await db
      .insert(booking)
      .values({
        title: "Meeting Still in Google",
        organizerUserId: testUserId,
        startTime: start,
        endTime: end,
        status: "confirmed",
        gcalEventId: "gcal_active_456",
      })
      .returning();

    const [b3Local] = await db
      .insert(booking)
      .values({
        title: "Local Database Only Booking",
        organizerUserId: testUserId,
        startTime: start,
        endTime: end,
        status: "confirmed",
        gcalEventId: null,
      })
      .returning();

    // Active Google Calendar IDs only contains b2
    const activeGcalIds = new Set(["gcal_active_456"]);

    const cancelledIds = await reconcileDeletedGoogleEvents({
      bookings: [
        {
          id: b1.id,
          gcalEventId: b1.gcalEventId,
          googleEventId: null,
          startTime: b1.startTime,
          endTime: b1.endTime,
          status: b1.status,
        },
        {
          id: b2.id,
          gcalEventId: b2.gcalEventId,
          googleEventId: null,
          startTime: b2.startTime,
          endTime: b2.endTime,
          status: b2.status,
        },
        {
          id: b3Local.id,
          gcalEventId: null,
          googleEventId: null,
          startTime: b3Local.startTime,
          endTime: b3Local.endTime,
          status: b3Local.status,
        },
      ],
      activeGcalIds,
      timeMinIso: "2026-10-22T00:00:00Z",
      timeMaxIso: "2026-10-23T00:00:00Z",
    });

    expect(cancelledIds.has(b1.id)).toBe(true);
    expect(cancelledIds.has(b2.id)).toBe(false);
    expect(cancelledIds.has(b3Local.id)).toBe(false);

    // Verify DB records
    const [updatedB1] = await db
      .select()
      .from(booking)
      .where(eq(booking.id, b1.id));
    const [updatedB2] = await db
      .select()
      .from(booking)
      .where(eq(booking.id, b2.id));
    const [updatedB3] = await db
      .select()
      .from(booking)
      .where(eq(booking.id, b3Local.id));

    expect(updatedB1.status).toBe("cancelled");
    expect(updatedB1.cancellationReason).toBe("Deleted on Google Calendar");
    expect(updatedB2.status).toBe("confirmed");
    expect(updatedB3.status).toBe("confirmed");

    // Cleanup
    await db.delete(booking).where(eq(booking.id, b1.id));
    await db.delete(booking).where(eq(booking.id, b2.id));
    await db.delete(booking).where(eq(booking.id, b3Local.id));
  });

  it("handles explicit cancelledGcalIds reported by Google Calendar API", async () => {
    const start = new Date("2026-10-22T14:00:00Z");
    const end = new Date("2026-10-22T15:00:00Z");

    const [b] = await db
      .insert(booking)
      .values({
        title: "Explicit Cancelled Meeting",
        organizerUserId: testUserId,
        startTime: start,
        endTime: end,
        status: "confirmed",
        gcalEventId: "gcal_explicit_cancelled_789",
      })
      .returning();

    const cancelledIds = await reconcileDeletedGoogleEvents({
      bookings: [
        {
          id: b.id,
          gcalEventId: b.gcalEventId,
          googleEventId: null,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
        },
      ],
      activeGcalIds: new Set(),
      cancelledGcalIds: new Set(["gcal_explicit_cancelled_789"]),
      timeMinIso: "2026-10-22T00:00:00Z",
      timeMaxIso: "2026-10-23T00:00:00Z",
    });

    expect(cancelledIds.has(b.id)).toBe(true);

    const [updated] = await db
      .select()
      .from(booking)
      .where(eq(booking.id, b.id));
    expect(updated.status).toBe("cancelled");

    await db.delete(booking).where(eq(booking.id, b.id));
  });
});
