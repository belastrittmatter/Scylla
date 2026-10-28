import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { eventType, schedule, meetingRoom, booking, user } from "../../src/db/schema";
import { seedDatabase } from "../../src/db/seed";

describe("Database Seed Script", () => {
  test("seedDatabase populates default event types and schedules", async () => {
    await seedDatabase();
    const eventTypes = await db.select().from(eventType);
    expect(eventTypes.length).toBeGreaterThanOrEqual(3);
    const names = eventTypes.map((e) => e.name);
    expect(names).toContain("15m Quick Sync");
    expect(names).toContain("30m 1-on-1");
    expect(names).toContain("60m Team Sync / Review");

    const schedules = await db.select().from(schedule);
    expect(schedules.length).toBeGreaterThanOrEqual(1);
    expect(schedules[0].timeZone).toBe("Asia/Ho_Chi_Minh");
    expect(Array.isArray(schedules[0].workingHours)).toBe(true);
  });

  test("seedDatabase populates default users", async () => {
    await seedDatabase();
    const users = await db.select().from(user);
    const userEmails = users.map((u) => u.email);
    expect(userEmails).toContain("alex@example.com");
    expect(userEmails).toContain("test@example.com");
    expect(userEmails).toContain("user1@example.com");
  });

  test("seedDatabase is idempotent when executed multiple times", async () => {
    await seedDatabase();
    await seedDatabase();

    const eventTypes = await db.select().from(eventType);
    const users = await db.select().from(user);

    expect(eventTypes.length).toBe(3);
    expect(users.length).toBeGreaterThanOrEqual(3);
  });

  test("booking table supports inserting and reading bookings with foreign keys", async () => {
    await seedDatabase();
    const [organizer] = await db.select().from(user).limit(1);
    const [type] = await db.select().from(eventType).limit(1);

    expect(organizer).toBeDefined();
    expect(type).toBeDefined();

    // Ensure a test room exists for foreign key constraints
    let [room] = await db.select().from(meetingRoom).limit(1);
    if (!room) {
      [room] = await db
        .insert(meetingRoom)
        .values({
          name: "Test Room",
          email: "test-room@resource.calendar.google.com",
          capacity: 10,
        })
        .returning();
    }

    expect(room).toBeDefined();

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    const [newBooking] = await db
      .insert(booking)
      .values({
        title: "Test Sync",
        organizerUserId: organizer.id,
        roomId: room.id,
        eventTypeId: type.id,
        startTime,
        endTime,
        attendees: [{ email: organizer.email, name: organizer.name }],
        meetingUrl: "https://meet.google.com/abc-defg-hij",
      })
      .returning();

    expect(newBooking.id).toBeDefined();
    expect(newBooking.title).toBe("Test Sync");
    expect(newBooking.status).toBe("confirmed");

    const fetched = await db.select().from(booking).where(eq(booking.id, newBooking.id));
    expect(fetched.length).toBe(1);
    expect(fetched[0].roomId).toBe(room.id);
    expect(fetched[0].eventTypeId).toBe(type.id);

    // Clean up test booking
    await db.delete(booking).where(eq(booking.id, newBooking.id));
  });
});
