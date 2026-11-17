import { relations } from "drizzle-orm";
import { user } from "./auth";
import { booking } from "./scheduling";
import {
  project,
  task,
  taskComment,
  taskTimeSession,
  team,
  teamMember,
} from "./workspace";

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
