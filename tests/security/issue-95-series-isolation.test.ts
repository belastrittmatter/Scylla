import { describe, expect, spyOn, test } from "bun:test";
import { db } from "@/db";
import { user, booking } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BookingService } from "@/services/booking";
import { GoogleCalendarService } from "@/services/google-calendar";
import { sanitizeBookingDescription } from "@/services/booking/booking-token-helper";
import { createCalendarMcpServer } from "@/app/api/mcp/route";

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
      await BookingService.cancelSeriesByBooking({
        bookingId: attackerBooking.id,
        callerId: attackerUser.id,
      });

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
        BookingService.cancelSeriesByBooking({
          bookingId: victimBooking.id,
          callerId: attackerUser.id,
        }),
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
      const cancelledUnderscore = await BookingService.cancelSeries({
        seriesId: wildcardUnderscores,
        reason: "test wildcard",
        callerId: testUser.id,
      });
      expect(cancelledUnderscore.length).toBe(0);

      // Attacker tries % wildcard
      const cancelledPercent = await BookingService.cancelSeries({
        seriesId: "series_%",
        reason: "test wildcard",
        callerId: testUser.id,
      });
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
      // 1. createBooking strips (by default) embedded series tags
      const created = await BookingService.createBooking({
        title: "User Created Booking",
        description: "Malicious note <!--series:injected_uuid_123-->",
        organizerUserId: organizer.id,
        startTime: new Date(now + 3600000),
        endTime: new Date(now + 7200000),
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
    const cancelledTricky = await BookingService.cancelSeries({
      seriesId: trickyId,
      reason: "test tricky",
      callerId: testUser.id,
    });
    expect(cancelledTricky.length).toBe(0);

    // Unescaped, `%` would match "_normal_" and cancel the target.
    const suffix = legitimateSeriesId.split("_").pop();
    const cancelledInteriorPercent = await BookingService.cancelSeries({
      seriesId: `series_legit%${suffix}`,
      reason: "test interior percent",
      callerId: testUser.id,
    });
    expect(cancelledInteriorPercent.length).toBe(0);

    // Verify the booking is still confirmed
    const [reloaded] = await db
      .select()
      .from(booking)
      .where(eq(booking.id, targetBooking.id));
    expect(reloaded.status).toBe("confirmed");

    // Calling cancelSeries with an empty or missing callerId must throw
    await expect(
      BookingService.cancelSeries({
        seriesId: legitimateSeriesId,
        callerId: "",
      }),
    ).rejects.toThrow(/Caller user ID/i);
    await expect(
      // @ts-expect-error callerId is required at the type level
      BookingService.cancelSeries({ seriesId: legitimateSeriesId }),
    ).rejects.toThrow(/Caller user ID/i);
    await expect(
      // @ts-expect-error callerId is required at the type level
      BookingService.cancelSeriesByBooking({ bookingId: targetBooking.id }),
    ).rejects.toThrow(/Caller user ID/i);
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

test("C3: nested or multiple series tags are recursively stripped by default", async () => {
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
      BookingService.cancelSeriesByBooking({
        bookingId: seriesBooking.id,
        callerId: attendee.id,
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

test("C4: unknown booking id throws NotFound without touching Google Calendar", async () => {
  const deleteSpy = spyOn(GoogleCalendarService, "deleteEvent");
  try {
    const unknownId = `gcal-${crypto.randomUUID()}`;
    await expect(
      BookingService.cancelSeriesByBooking({
        bookingId: unknownId,
        callerId: crypto.randomUUID(),
      }),
    ).rejects.toThrow(/not found/i);
    await expect(BookingService.cancel(unknownId)).rejects.toThrow(
      /not found/i,
    );
    expect(deleteSpy).not.toHaveBeenCalled();
  } finally {
    deleteSpy.mockRestore();
  }
});

describe("C5: series marker sanitization", () => {
  test("keeps user text around malformed markers", () => {
    const desc = "Agenda <!--series: draft\nDial-in: 1234 <!-- keep -->";
    expect(sanitizeBookingDescription(desc)).toBe(desc);
  });

  test("strips whitespace-padded markers", () => {
    expect(sanitizeBookingDescription("Notes <!-- series: abc_1 --> end")).toBe(
      "Notes  end",
    );
  });

  test("rejects markers that survive bounded stripping", () => {
    let nested = "x";
    for (let i = 0; i < 10; i++) nested = `<!--series:a${nested}b-->`;
    expect(() => sanitizeBookingDescription(nested)).toThrow(
      /unsanitizable series tag/,
    );
  });

  test("MCP book_meeting does not store raw series markers", async () => {
    const [organizer] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "MCP Marker Organizer",
        email: `mcp-marker-${Date.now()}@example.com`,
      })
      .returning();
    try {
      const server = await createCalendarMcpServer({
        sub: organizer.id,
        scopes: ["*"],
      });
      const tools = (
        server as unknown as {
          _registeredTools: Record<
            string,
            {
              handler: (
                a: Record<string, unknown>,
              ) => Promise<{ content: Array<{ text: string }> }>;
            }
          >;
        }
      )._registeredTools;
      const res = await tools["book_meeting"].handler({
        summary: "Spoof",
        description: "Hi <!--series:series_victim-->",
        start: "2026-12-01T09:00:00.000Z",
        end: "2026-12-01T10:00:00.000Z",
        attendees: [],
      });
      const { eventId } = JSON.parse(res.content[0].text);
      const [stored] = await db
        .select()
        .from(booking)
        .where(eq(booking.gcalEventId, eventId));
      expect(stored).toBeDefined();
      expect(stored.description).toBe("Hi");
    } finally {
      await db
        .delete(booking)
        .where(eq(booking.organizerUserId, organizer.id))
        .catch(() => {});
      await db
        .delete(user)
        .where(eq(user.id, organizer.id))
        .catch(() => {});
    }
  });
});

describe("C6: reschedule", () => {
  test("updates the stored booking when addressed by an alias id and propagates a cleared description", async () => {
    const [organizer] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Reschedule Organizer",
        email: `resched-${Date.now()}@example.com`,
      })
      .returning();
    const updateSpy = spyOn(GoogleCalendarService, "updateEvent");
    const now = Date.now();
    try {
      const created = await BookingService.createBooking({
        title: "Original",
        description: "Has notes",
        organizerUserId: organizer.id,
        startTime: new Date(now + 3600000),
        endTime: new Date(now + 7200000),
      });
      expect(created.gcalEventId).toBeTruthy();

      const updated = await BookingService.reschedule(
        `gcal-${created.gcalEventId}`,
        { title: "Renamed", description: "" },
      );
      expect(updated?.id).toBe(created.id);
      expect(updated.title).toBe("Renamed");
      expect(updated.description).toBeNull();

      const gcalPayload = updateSpy.mock.calls.at(-1)?.[1];
      expect(gcalPayload?.description).toBe("");
    } finally {
      updateSpy.mockRestore();
      await db
        .delete(booking)
        .where(eq(booking.organizerUserId, organizer.id))
        .catch(() => {});
      await db
        .delete(user)
        .where(eq(user.id, organizer.id))
        .catch(() => {});
    }
  });
});

describe("C7: MCP cancel/reschedule ownership", () => {
  type ToolResult = { isError?: boolean; content: Array<{ text: string }> };
  async function mcpTools(sub: string) {
    const server = await createCalendarMcpServer({ sub, scopes: ["*"] });
    return (
      server as unknown as {
        _registeredTools: Record<
          string,
          { handler: (a: Record<string, unknown>) => Promise<ToolResult> }
        >;
      }
    )._registeredTools;
  }

  test("non-organizer cannot cancel or reschedule; organizer can cancel", async () => {
    const [organizer, attacker] = await db
      .insert(user)
      .values([
        {
          id: crypto.randomUUID(),
          name: "MCP Owner",
          email: `mcp-owner-${Date.now()}@example.com`,
        },
        {
          id: crypto.randomUUID(),
          name: "MCP Attacker",
          email: `mcp-attacker-${Date.now()}@example.com`,
        },
      ])
      .returning();
    const deleteSpy = spyOn(GoogleCalendarService, "deleteEvent");
    const updateSpy = spyOn(GoogleCalendarService, "updateEvent");
    const now = Date.now();
    try {
      const created = await BookingService.createBooking({
        title: "Owner Meeting",
        organizerUserId: organizer.id,
        startTime: new Date(now + 3600000),
        endTime: new Date(now + 7200000),
      });
      const eventId = created.gcalEventId as string;
      const attackerTools = await mcpTools(attacker.id);

      const cancelRes = await attackerTools["cancel_meeting"].handler({
        eventId,
      });
      expect(cancelRes.isError).toBe(true);
      expect(cancelRes.content[0].text).toMatch(/Forbidden/);

      const reschedRes = await attackerTools["reschedule_meeting"].handler({
        eventId: created.id,
        newStart: new Date(now + 86400000).toISOString(),
        newEnd: new Date(now + 90000000).toISOString(),
      });
      expect(reschedRes.isError).toBe(true);
      expect(reschedRes.content[0].text).toMatch(/Forbidden/);

      expect(deleteSpy).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
      const [untouched] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, created.id));
      expect(untouched.status).toBe("confirmed");
      expect(untouched.startTime.getTime()).toBe(created.startTime.getTime());

      const ownerTools = await mcpTools(organizer.id);
      const ownerCancel = await ownerTools["cancel_meeting"].handler({
        eventId,
      });
      expect(ownerCancel.isError).toBeFalsy();
      const [cancelled] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, created.id));
      expect(cancelled.status).toBe("cancelled");
    } finally {
      deleteSpy.mockRestore();
      updateSpy.mockRestore();
      await db
        .delete(booking)
        .where(eq(booking.organizerUserId, organizer.id))
        .catch(() => {});
      for (const u of [organizer, attacker]) {
        await db
          .delete(user)
          .where(eq(user.id, u.id))
          .catch(() => {});
      }
    }
  });
});
