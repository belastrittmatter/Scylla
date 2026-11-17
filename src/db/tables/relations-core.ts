import { relations } from "drizzle-orm";
import { account, apikey, session, user } from "./auth";
import {
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  oauthRefreshToken,
} from "./oauth";
import {
  booking,
  bookingAttendee,
  eventType,
  meetingInvite,
  meetingRoom,
  schedule,
  scheduleRule,
} from "./scheduling";
import { project, task, taskComment, team, teamMember } from "./workspace";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  apiKeys: many(apikey),
  schedules: many(schedule),
  eventTypes: many(eventType),
  bookings: many(booking),
  meetingInvites: many(meetingInvite),
  oauthClients: many(oauthClient),
  oauthRefreshTokens: many(oauthRefreshToken),
  oauthAccessTokens: many(oauthAccessToken),
  oauthConsents: many(oauthConsent),
  ownedTeams: many(team),
  teamMemberships: many(teamMember),
  assignedTasks: many(task, { relationName: "taskAssignee" }),
  createdTasks: many(task, { relationName: "taskCreator" }),
  taskComments: many(taskComment),
}));

export const sessionRelations = relations(session, ({ one, many }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
  oauthRefreshTokens: many(oauthRefreshToken),
  oauthAccessTokens: many(oauthAccessToken),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const apikeyRelations = relations(apikey, ({ one }) => ({
  user: one(user, {
    fields: [apikey.userId],
    references: [user.id],
  }),
}));

export const scheduleRelations = relations(schedule, ({ one, many }) => ({
  user: one(user, {
    fields: [schedule.userId],
    references: [user.id],
  }),
  rules: many(scheduleRule),
}));

export const scheduleRuleRelations = relations(scheduleRule, ({ one }) => ({
  schedule: one(schedule, {
    fields: [scheduleRule.scheduleId],
    references: [schedule.id],
  }),
}));

export const eventTypeRelations = relations(eventType, ({ one, many }) => ({
  user: one(user, {
    fields: [eventType.userId],
    references: [user.id],
  }),
  bookings: many(booking),
}));

export const meetingRoomRelations = relations(meetingRoom, ({ many }) => ({
  bookings: many(booking),
}));

export const bookingRelations = relations(booking, ({ one, many }) => ({
  organizer: one(user, {
    fields: [booking.organizerUserId],
    references: [user.id],
  }),
  eventType: one(eventType, {
    fields: [booking.eventTypeId],
    references: [eventType.id],
  }),
  room: one(meetingRoom, {
    fields: [booking.roomId],
    references: [meetingRoom.id],
  }),
  project: one(project, {
    fields: [booking.projectId],
    references: [project.id],
  }),
  attendeesList: many(bookingAttendee),
}));

export const bookingAttendeeRelations = relations(
  bookingAttendee,
  ({ one }) => ({
    booking: one(booking, {
      fields: [bookingAttendee.bookingId],
      references: [booking.id],
    }),
  }),
);

export const meetingInviteRelations = relations(meetingInvite, ({ one }) => ({
  organizer: one(user, {
    fields: [meetingInvite.organizerUserId],
    references: [user.id],
  }),
  room: one(meetingRoom, {
    fields: [meetingInvite.roomId],
    references: [meetingRoom.id],
  }),
  booking: one(booking, {
    fields: [meetingInvite.bookingId],
    references: [booking.id],
  }),
}));
