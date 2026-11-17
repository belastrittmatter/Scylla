import { relations } from "drizzle-orm";
import { account, apikey, session, user } from "./schema-auth";
import {
  booking,
  bookingAttendee,
  eventType,
  meetingInvite,
  meetingRoom,
  schedule,
  scheduleRule,
} from "./schema-booking";
import {
  oauthAccessToken,
  oauthClient,
  oauthClientResource,
  oauthConsent,
  oauthRefreshToken,
  oauthResource,
} from "./schema-oauth";
import {
  project,
  task,
  taskComment,
  taskTimeSession,
  team,
  teamMember,
} from "./schema-workspace";

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

export const oauthClientRelations = relations(oauthClient, ({ one, many }) => ({
  user: one(user, {
    fields: [oauthClient.userId],
    references: [user.id],
  }),
  oauthClientResources: many(oauthClientResource),
  oauthRefreshTokens: many(oauthRefreshToken),
  oauthAccessTokens: many(oauthAccessToken),
  oauthConsents: many(oauthConsent),
}));

export const oauthResourceRelations = relations(oauthResource, ({ many }) => ({
  oauthClientResources: many(oauthClientResource),
}));

export const oauthClientResourceRelations = relations(
  oauthClientResource,
  ({ one }) => ({
    oauthClient: one(oauthClient, {
      fields: [oauthClientResource.clientId],
      references: [oauthClient.clientId],
    }),
    oauthResource: one(oauthResource, {
      fields: [oauthClientResource.resourceId],
      references: [oauthResource.identifier],
    }),
  }),
);

export const oauthRefreshTokenRelations = relations(
  oauthRefreshToken,
  ({ one, many }) => ({
    oauthClient: one(oauthClient, {
      fields: [oauthRefreshToken.clientId],
      references: [oauthClient.clientId],
    }),
    session: one(session, {
      fields: [oauthRefreshToken.sessionId],
      references: [session.id],
    }),
    user: one(user, {
      fields: [oauthRefreshToken.userId],
      references: [user.id],
    }),
    oauthAccessTokens: many(oauthAccessToken),
  }),
);

export const oauthAccessTokenRelations = relations(
  oauthAccessToken,
  ({ one }) => ({
    oauthClient: one(oauthClient, {
      fields: [oauthAccessToken.clientId],
      references: [oauthClient.clientId],
    }),
    session: one(session, {
      fields: [oauthAccessToken.sessionId],
      references: [session.id],
    }),
    user: one(user, {
      fields: [oauthAccessToken.userId],
      references: [user.id],
    }),
    oauthRefreshToken: one(oauthRefreshToken, {
      fields: [oauthAccessToken.refreshId],
      references: [oauthRefreshToken.id],
    }),
  }),
);

export const oauthConsentRelations = relations(oauthConsent, ({ one }) => ({
  oauthClient: one(oauthClient, {
    fields: [oauthConsent.clientId],
    references: [oauthClient.clientId],
  }),
  user: one(user, {
    fields: [oauthConsent.userId],
    references: [user.id],
  }),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  owner: one(user, {
    fields: [team.ownerId],
    references: [user.id],
  }),
  members: many(teamMember),
  projects: many(project),
  tasks: many(task),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}));

export const projectRelations = relations(project, ({ one, many }) => ({
  team: one(team, {
    fields: [project.teamId],
    references: [team.id],
  }),
  tasks: many(task),
  bookings: many(booking),
}));

export const taskRelations = relations(task, ({ one, many }) => ({
  team: one(team, {
    fields: [task.teamId],
    references: [team.id],
  }),
  project: one(project, {
    fields: [task.projectId],
    references: [project.id],
  }),
  creator: one(user, {
    fields: [task.creatorId],
    references: [user.id],
    relationName: "taskCreator",
  }),
  assignee: one(user, {
    fields: [task.assigneeId],
    references: [user.id],
    relationName: "taskAssignee",
  }),
  comments: many(taskComment),
  timeSessions: many(taskTimeSession),
}));

export const taskCommentRelations = relations(taskComment, ({ one }) => ({
  task: one(task, {
    fields: [taskComment.taskId],
    references: [task.id],
  }),
  user: one(user, {
    fields: [taskComment.userId],
    references: [user.id],
  }),
}));

export const taskTimeSessionRelations = relations(
  taskTimeSession,
  ({ one }) => ({
    task: one(task, {
      fields: [taskTimeSession.taskId],
      references: [task.id],
    }),
    user: one(user, {
      fields: [taskTimeSession.userId],
      references: [user.id],
    }),
  }),
);
