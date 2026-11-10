import { describe, expect, test } from "bun:test";
import { db } from "@/db";
import { user, booking } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BookingService } from "@/services/booking";

describe("Issue #95 Series Cancellation Isolation", () => {
  test("C1: cancelling series does not cancel other users' bookings with matching series tag", async () => {
    const [victimUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Victim User",
        email: `victim-${Date.now()}@example.com`,
      })
      .returning();

    const [attackerUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Attacker User",
        email: `attacker-${Date.now()}@example.com`,
      })
      .returning();

    const now = Date.now();
    const victimSeriesId = `series_victim_${Date.now()}`;

    // 1. Victim's legitimate recurring series booking
    const [victimBooking] = await db
      .insert(booking)
      .values({
        organizerUserId: victimUser.id,
        title: "Victim Standup",
        description: `Regular sync <!--series:${victimSeriesId}-->`,
        status: "confirmed",
        startTime: new Date(now + 3600000),
        endTime: new Date(now + 7200000),
      })
      .returning();

    // 2. Attacker creates their own booking spoofing victim's series ID
    const [attackerBooking] = await db
      .insert(booking)
      .values({
        organizerUserId: attackerUser.id,
        title: "Attacker Malicious Booking",
        description: `Fake note <!--series:${victimSeriesId}-->`,
        status: "confirmed",
        startTime: new Date(now + 10800000),
        endTime: new Date(now + 14400000),
      })
      .returning();

    try {
      // Attacker attempts to cancel the series by cancelling their own booking with allSeries
      // Using callerId = attackerUser.id
      await BookingService.cancelSeriesByBooking(
        attackerBooking.id,
        attackerUser.id,
      );

      // Victim's booking MUST STILL BE CONFIRMED!
      const [reloadedVictim] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, victimBooking.id));

      expect(reloadedVictim).toBeDefined();
      expect(reloadedVictim.status).toBe("confirmed");

      // Attacker's booking was cancelled
      const [reloadedAttacker] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, attackerBooking.id));
      expect(reloadedAttacker.status).toBe("cancelled");
    } finally {
      await db
        .delete(booking)
        .where(eq(booking.id, victimBooking.id))
        .catch(() => {});
      await db
        .delete(booking)
        .where(eq(booking.id, attackerBooking.id))
        .catch(() => {});
      await db
        .delete(user)
        .where(eq(user.id, victimUser.id))
        .catch(() => {});
      await db
        .delete(user)
        .where(eq(user.id, attackerUser.id))
        .catch(() => {});
    }
  });

  test("C1: unauthorized caller cannot cancel another user's series via cancelSeriesByBooking", async () => {
    const [victimUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Victim User 2",
        email: `victim2-${Date.now()}@example.com`,
      })
      .returning();

    const [attackerUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Attacker User 2",
        email: `attacker2-${Date.now()}@example.com`,
      })
      .returning();

    const now = Date.now();
    const seriesId = `series_victim2_${Date.now()}`;

    const [victimBooking] = await db
      .insert(booking)
      .values({
        organizerUserId: victimUser.id,
        title: "Victim Team Sync",
        description: `Team Sync <!--series:${seriesId}-->`,
        status: "confirmed",
        startTime: new Date(now + 3600000),
        endTime: new Date(now + 7200000),
      })
      .returning();

    try {
      // Attacker attempts to cancel victim's booking directly
      await expect(
        BookingService.cancelSeriesByBooking(
          victimBooking.id,
          undefined,
          attackerUser.id,
        ),
      ).rejects.toThrow(/Forbidden/i);

      // Victim booking remains confirmed
      const [reloaded] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, victimBooking.id));
      expect(reloaded.status).toBe("confirmed");
    } finally {
      await db
        .delete(booking)
        .where(eq(booking.id, victimBooking.id))
        .catch(() => {});
      await db
        .delete(user)
        .where(eq(user.id, victimUser.id))
        .catch(() => {});
      await db
        .delete(user)
        .where(eq(user.id, attackerUser.id))
        .catch(() => {});
    }
  });

  test("C2: wildcards (% and _) in seriesId do not match or cancel other series", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Wildcard Test User",
        email: `wildcard-${Date.now()}@example.com`,
      })
      .returning();

    const now = Date.now();
    // Series containing literal underscores
    const legitimateSeriesId = `series_alpha_beta_${Date.now()}`;

    const [targetBooking] = await db
      .insert(booking)
      .values({
        organizerUserId: testUser.id,
        title: "Alpha Beta Meeting",
        description: `Meeting notes <!--series:${legitimateSeriesId}-->`,
        status: "confirmed",
        startTime: new Date(now + 3600000),
        endTime: new Date(now + 7200000),
      })
      .returning();

    try {
      // Attacker constructs a series ID consisting of wildcard underscores matching same length
      const wildcardUnderscores = "series_alpha_beta_" + "_".repeat(13);
      const cancelledUnderscore = await BookingService.cancelSeries(
        wildcardUnderscores,
        "test wildcard",
        testUser.id,
      );
      expect(cancelledUnderscore.length).toBe(0);

      // Attacker tries % wildcard
      const cancelledPercent = await BookingService.cancelSeries(
        "series_%",
        "test wildcard",
        testUser.id,
      );
      expect(cancelledPercent.length).toBe(0);

      // Verify the booking is still confirmed
      const [reloaded] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, targetBooking.id));
      expect(reloaded.status).toBe("confirmed");
    } finally {
      await db
        .delete(booking)
        .where(eq(booking.id, targetBooking.id))
        .catch(() => {});
      await db
        .delete(user)
        .where(eq(user.id, testUser.id))
        .catch(() => {});
    }
  });

  test("C3: sanitizeBookingDescription and createBooking sanitize embedded series tags", async () => {
    const [organizer] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Organizer Sanitize",
        email: `sanitize-${Date.now()}@example.com`,
      })
      .returning();

    const now = Date.now();

    try {
      // 1. createBooking with sanitizeDescription: true strips embedded series tags
      const created = await BookingService.createBooking({
        title: "User Created Booking",
        description: "Malicious note <!--series:injected_uuid_123-->",
        organizerUserId: organizer.id,
        startTime: new Date(now + 3600000),
        endTime: new Date(now + 7200000),
        sanitizeDescription: true,
      });

      expect(created.description).not.toContain(
        "<!--series:injected_uuid_123-->",
      );
      expect(created.description).toBe("Malicious note");

      // 3. reschedule strips spoofed tags while preserving clean notes
      const rescheduled = await BookingService.reschedule(created.id, {
        description: "Rescheduled note <!--series:another_spoof-->",
      });
      expect(rescheduled.description).not.toContain(
        "<!--series:another_spoof-->",
      );
      expect(rescheduled.description).toBe("Rescheduled note");

      // 4. createBooking with seriesId safely sets the system series tag
      const legitimateSeriesId = `series_legit_${Date.now()}`;
      const recurring = await BookingService.createBooking({
        title: "Legitimate Recurring",
        description: "Sprint planning <!--series:ignored_user_tag-->",
        seriesId: legitimateSeriesId,
        organizerUserId: organizer.id,
        startTime: new Date(now + 10800000),
        endTime: new Date(now + 14400000),
      });

      expect(recurring.description).toContain(
        `<!--series:${legitimateSeriesId}-->`,
      );
      expect(recurring.description).not.toContain(
        "<!--series:ignored_user_tag-->",
      );

      await db
        .delete(booking)
        .where(eq(booking.id, created.id))
        .catch(() => {});
      await db
        .delete(booking)
        .where(eq(booking.id, recurring.id))
        .catch(() => {});
    } finally {
      await db
        .delete(user)
        .where(eq(user.id, organizer.id))
        .catch(() => {});
    }
  });
});

test("C2: literal backslash, percent, and underscore in seriesId do not cancel other series", async () => {
  const [testUser] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "Escape Test User",
      email: `escape-${Date.now()}@example.com`,
    })
    .returning();

  const now = Date.now();
  // Series containing literal backslash and percent in the middle of id
  const legitimateSeriesId = `series_legit_normal_${Date.now()}`;

  const [targetBooking] = await db
    .insert(booking)
    .values({
      organizerUserId: testUser.id,
      title: "Normal Meeting",
      description: `Meeting notes <!--series:${legitimateSeriesId}-->`,
      status: "confirmed",
      startTime: new Date(now + 3600000),
      endTime: new Date(now + 7200000),
    })
    .returning();

  try {
    // Attacker tries literal backslash and % in middle of queried id
    const trickyId = "series_legit\\%normal";
    const cancelledTricky = await BookingService.cancelSeries(
      trickyId,
      "test tricky",
      testUser.id,
    );
    expect(cancelledTricky.length).toBe(0);

    // Verify the booking is still confirmed
    const [reloaded] = await db
      .select()
      .from(booking)
      .where(eq(booking.id, targetBooking.id));
    expect(reloaded.status).toBe("confirmed");

    // Calling cancelSeries without ownerUserId must throw
    await expect(
      BookingService.cancelSeries(legitimateSeriesId, "test no owner", ""),
    ).rejects.toThrow(/Owner user ID/i);
  } finally {
    await db
      .delete(booking)
      .where(eq(booking.id, targetBooking.id))
      .catch(() => {});
    await db
      .delete(user)
      .where(eq(user.id, testUser.id))
      .catch(() => {});
  }
});

test("C3: nested or multiple series tags are recursively stripped when sanitizeDescription is used", async () => {
  const [organizer] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "Nested Sanitize User",
      email: `nested-${Date.now()}@example.com`,
    })
    .returning();

  const now = Date.now();

  try {
    // Nested series tag injection
    const nestedTag = "Start <!--series:outer<!--series:inner-->tag--> End";
    const created = await BookingService.createBooking({
      title: "Nested Tag Booking",
      description: nestedTag,
      organizerUserId: organizer.id,
      startTime: new Date(now + 3600000),
      endTime: new Date(now + 7200000),
      sanitizeDescription: true,
    });

    expect(created.description).not.toContain("<!--series:");
    expect(created.description).not.toContain("outer");
    expect(created.description).not.toContain("inner");

    await db
      .delete(booking)
      .where(eq(booking.id, created.id))
      .catch(() => {});
  } finally {
    await db
      .delete(user)
      .where(eq(user.id, organizer.id))
      .catch(() => {});
  }
});

test("C1: non-organizer attendee cannot cancel entire series", async () => {
  const [organizer] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "Series Organizer",
      email: `organizer-${Date.now()}@example.com`,
    })
    .returning();

  const [attendee] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "Series Attendee",
      email: `attendee-${Date.now()}@example.com`,
    })
    .returning();

  const now = Date.now();
  const seriesId = `series_org_${Date.now()}`;

  const [seriesBooking] = await db
    .insert(booking)
    .values({
      organizerUserId: organizer.id,
      title: "Organizer Team Meeting",
      description: `Recurring team meeting <!--series:${seriesId}-->`,
      status: "confirmed",
      startTime: new Date(now + 3600000),
      endTime: new Date(now + 7200000),
    })
    .returning();

  try {
    // Attendee tries to cancel the organizer's entire series
    await expect(
      BookingService.cancelSeriesByBooking(seriesBooking.id, {
        callerUserId: attendee.id,
      }),
    ).rejects.toThrow(
      /Only the meeting organizer may cancel this booking series/i,
    );

    // Verify the booking is still confirmed
    const [reloaded] = await db
      .select()
      .from(booking)
      .where(eq(booking.id, seriesBooking.id));
    expect(reloaded.status).toBe("confirmed");
  } finally {
    await db
      .delete(booking)
      .where(eq(booking.id, seriesBooking.id))
      .catch(() => {});
    await db
      .delete(user)
      .where(eq(user.id, organizer.id))
      .catch(() => {});
    await db
      .delete(user)
      .where(eq(user.id, attendee.id))
      .catch(() => {});
  }
});
