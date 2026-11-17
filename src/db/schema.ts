export * from "./schema-auth";
export * from "./schema-oauth";
export * from "./schema-agent";
export * from "./schema-booking";
export * from "./schema-workspace";
export * from "./schema-relations";

import type { user, session, account, apikey } from "./schema-auth";
import type {
  schedule,
  scheduleRule,
  eventType,
  meetingRoom,
  booking,
  bookingAttendee,
  meetingInvite,
} from "./schema-booking";
import type {
  team,
  teamMember,
  project,
  task,
  taskComment,
  taskTimeSession,
} from "./schema-workspace";

// ---------------------------------------------------------------------------
// Exported TypeScript Types
// ---------------------------------------------------------------------------

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type ApiKey = typeof apikey.$inferSelect;
export type NewApiKey = typeof apikey.$inferInsert;

export type Schedule = typeof schedule.$inferSelect;
export type NewSchedule = typeof schedule.$inferInsert;

export type ScheduleRule = typeof scheduleRule.$inferSelect;
export type NewScheduleRule = typeof scheduleRule.$inferInsert;

export type EventType = typeof eventType.$inferSelect;
export type NewEventType = typeof eventType.$inferInsert;

export type MeetingRoom = typeof meetingRoom.$inferSelect;
export type NewMeetingRoom = typeof meetingRoom.$inferInsert;

export type Booking = typeof booking.$inferSelect;
export type NewBooking = typeof booking.$inferInsert;

export type BookingAttendee = typeof bookingAttendee.$inferSelect;
export type NewBookingAttendee = typeof bookingAttendee.$inferInsert;

export type MeetingInvite = typeof meetingInvite.$inferSelect;
export type NewMeetingInvite = typeof meetingInvite.$inferInsert;

export type Team = typeof team.$inferSelect;
export type NewTeam = typeof team.$inferInsert;

export type TeamMember = typeof teamMember.$inferSelect;
export type NewTeamMember = typeof teamMember.$inferInsert;

export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;

export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;

export type TaskComment = typeof taskComment.$inferSelect;
export type NewTaskComment = typeof taskComment.$inferInsert;

export type TaskTimeSession = typeof taskTimeSession.$inferSelect;
export type NewTaskTimeSession = typeof taskTimeSession.$inferInsert;
