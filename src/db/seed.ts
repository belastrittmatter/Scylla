import { eq } from "drizzle-orm";
import { db } from "./index";
import { user, eventType, schedule } from "./schema";

export const defaultEventTypes = [
  {
    name: "15m Quick Sync",
    slug: "15m-quick-sync",
    duration: 15,
    beforeBuffer: 5,
    afterBuffer: 5,
    description: "Quick 15-minute sync or check-in",
  },
  {
    name: "30m 1-on-1",
    slug: "30m-1-on-1",
    duration: 30,
    beforeBuffer: 5,
    afterBuffer: 5,
    description: "Standard 30-minute one-on-one meeting",
  },
  {
    name: "60m Team Sync / Review",
    slug: "60m-team-sync-review",
    duration: 60,
    beforeBuffer: 10,
    afterBuffer: 10,
    description: "Comprehensive 60-minute team sync or review",
  },
];

export const defaultUsers = [
  {
    id: "usr_alex_rivera",
    name: "Alex Rivera",
    email: "alex@example.com",
    emailVerified: true,
  },
  {
    id: "usr_test_user",
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
  },
  {
    id: "usr_user1",
    name: "User One",
    email: "user1@example.com",
    emailVerified: true,
  },
];

export const defaultWorkingHours = [
  { day: 1, start: "08:00", end: "18:00" }, // Monday
  { day: 2, start: "08:00", end: "18:00" }, // Tuesday
  { day: 3, start: "08:00", end: "18:00" }, // Wednesday
  { day: 4, start: "08:00", end: "18:00" }, // Thursday
  { day: 5, start: "08:00", end: "18:00" }, // Friday
];

export async function seedDatabase() {
  // 1. Seed default users
  for (const u of defaultUsers) {
    await db
      .insert(user)
      .values(u)
      .onConflictDoUpdate({
        target: user.id,
        set: { name: u.name, email: u.email, emailVerified: true },
      });
  }

  // 2. Seed default event types
  for (const et of defaultEventTypes) {
    await db
      .insert(eventType)
      .values(et)
      .onConflictDoUpdate({
        target: eventType.slug,
        set: {
          name: et.name,
          duration: et.duration,
          beforeBuffer: et.beforeBuffer,
          afterBuffer: et.afterBuffer,
          description: et.description,
        },
      });
  }

  // 3. Seed default user schedules
  for (const u of defaultUsers) {
    const existing = await db
      .select()
      .from(schedule)
      .where(eq(schedule.userId, u.id));

    if (existing.length === 0) {
      await db.insert(schedule).values({
        userId: u.id,
        timeZone: "Asia/Ho_Chi_Minh",
        workingHours: defaultWorkingHours,
      });
    } else {
      await db
        .update(schedule)
        .set({
          timeZone: "Asia/Ho_Chi_Minh",
          workingHours: defaultWorkingHours,
        })
        .where(eq(schedule.userId, u.id));
    }
  }
}

const isDirectExecution =
  (import.meta as unknown as { main?: boolean }).main ||
  process.argv[1]?.endsWith("seed.ts");

if (isDirectExecution) {
  seedDatabase()
    .then(() => {
      console.log("Database seeded successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Database seeding failed:", err);
      process.exit(1);
    });
}
