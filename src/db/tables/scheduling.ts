import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { project } from "./workspace";

export const meetingRoom = pgTable(
  "meeting_room",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    googleResourceEmail: text("google_resource_email"),
    officeLocation: text("office_location").default("hcm"),
    capacity: integer("capacity").notNull().default(0),
    features: jsonb("features").$type<string[]>().default([]).notNull(),
    equipment: jsonb("equipment").$type<string[]>().default([]).notNull(),
    building: text("building"),
    floor: text("floor"),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meeting_room_email_idx").on(table.email),
    index("meeting_room_capacity_idx").on(table.capacity),
  ],
);

// ---------------------------------------------------------------------------
// 3. Event Types / Meeting Templates
// ---------------------------------------------------------------------------

export const eventType = pgTable(
  "event_type",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    duration: integer("duration").notNull(), // duration in minutes
    requiresRoom: boolean("requires_room").default(true),
    beforeBuffer: integer("before_buffer").default(0).notNull(), // buffer before in minutes
    afterBuffer: integer("after_buffer").default(0).notNull(), // buffer after in minutes
    minNoticeHours: integer("min_notice_hours").default(2),
    bookingHorizonDays: integer("booking_horizon_days").default(30),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("event_type_slug_idx").on(table.slug),
    index("event_type_userId_idx").on(table.userId),
  ],
);

// ---------------------------------------------------------------------------
// 4. Schedules & Working Hours (Availability Engine)
// ---------------------------------------------------------------------------

export const schedule = pgTable(
  "schedule",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").default("Working Hours"),
    timeZone: text("time_zone").default("Asia/Ho_Chi_Minh").notNull(),
    timezone: text("timezone").default("Asia/Ho_Chi_Minh"),
    isDefault: boolean("is_default").default(true),
    workingHours: jsonb("working_hours")
      .$type<Array<{ day: number; start: string; end: string }>>()
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("schedule_userId_idx").on(table.userId)],
);

export const scheduleRule = pgTable(
  "schedule_rule",
  {
    id: text("id").primaryKey(),
    scheduleId: text("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    startTime: text("start_time").notNull(), // e.g. "08:00"
    endTime: text("end_time").notNull(), // e.g. "18:00"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("schedule_rule_scheduleId_idx").on(table.scheduleId)],
);

// ---------------------------------------------------------------------------
// 5. Bookings & Attendees
// ---------------------------------------------------------------------------

export const booking = pgTable(
  "booking",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    eventTypeId: text("event_type_id").references(() => eventType.id, {
      onDelete: "set null",
    }),
    organizerUserId: text("organizer_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    roomId: text("room_id").references(() => meetingRoom.id, {
      onDelete: "set null",
    }),
    projectId: text("project_id").references(() => project.id, {
      onDelete: "set null",
    }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    status: text("status").default("confirmed").notNull(),
    attendees: jsonb("attendees")
      .$type<Array<{ email: string; name?: string; status?: string }>>()
      .default([])
      .notNull(),
    gcalEventId: text("gcal_event_id"),
    googleEventId: text("google_event_id"),
    meetingUrl: text("meeting_url"),
    googleMeetUrl: text("google_meet_url"),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("booking_organizerUserId_idx").on(table.organizerUserId),
    index("booking_startTime_idx").on(table.startTime),
    index("booking_roomId_idx").on(table.roomId),
    index("booking_projectId_idx").on(table.projectId),
  ],
);

export const bookingAttendee = pgTable(
  "booking_attendee",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    name: text("name"),
    rsvpStatus: text("rsvp_status").notNull().default("needs_action"), // "accepted" | "tentative" | "declined" | "needs_action"
    isOrganizer: boolean("is_organizer").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("booking_attendee_bookingId_idx").on(table.bookingId),
    index("booking_attendee_email_idx").on(table.email),
  ],
);

// ---------------------------------------------------------------------------
// 6. Meeting Invites / Shareable Collective Scheduling Links
// ---------------------------------------------------------------------------

export const meetingInvite = pgTable(
  "meeting_invite",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    duration: integer("duration").notNull().default(30),
    organizerUserId: text("organizer_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    memberEmails: jsonb("member_emails")
      .$type<string[]>()
      .default([])
      .notNull(),
    locationType: text("location_type").default("meet").notNull(),
    roomId: text("room_id").references(() => meetingRoom.id, {
      onDelete: "set null",
    }),
    isRestricted: boolean("is_restricted").default(false).notNull(),
    allowedEmails: jsonb("allowed_emails")
      .$type<string[]>()
      .default([])
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    bookingId: text("booking_id").references(() => booking.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meeting_invite_slug_idx").on(table.slug),
    index("meeting_invite_organizerUserId_idx").on(table.organizerUserId),
  ],
);
