import { z } from "zod";
import { CreateBookingPayloadSchema, ReschedulePayloadSchema } from "../actions/schemas";
import {
  TeamRoleSchema,
  CreateTeamSchema as DomainCreateTeamSchema,
  UpdateTeamSchema as DomainUpdateTeamSchema,
} from "./team/team-types";
import {
  CreateProjectSchema as DomainCreateProjectSchema,
  UpdateProjectSchema as DomainUpdateProjectSchema,
} from "./project/project-types";
import {
  TaskStatusSchema,
  TaskPrioritySchema,
  CreateTaskSchema as DomainCreateTaskSchema,
  UpdateTaskSchema as DomainUpdateTaskSchema,
  TaskDueDateSchema,
} from "./task/task-types";

export const TeamRoleApiSchema = TeamRoleSchema;

export const CreateTeamApiSchema = DomainCreateTeamSchema.omit({ ownerId: true }).extend({
  ownerId: z.string().min(1).optional(),
});

export const UpdateTeamApiSchema = DomainUpdateTeamSchema;

export const AddTeamMemberApiSchema = z
  .object({
    userId: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: TeamRoleApiSchema.default("member"),
  })
  .refine((data) => Boolean(data.userId || data.email), {
    message: "Either userId or email is required",
  });

export const CreateProjectApiSchema = DomainCreateProjectSchema;

export const UpdateProjectApiSchema = DomainUpdateProjectSchema;

export const TaskStatusApiEnum = TaskStatusSchema;

export const TaskPriorityApiEnum = TaskPrioritySchema;

export const CreateTaskApiSchema = DomainCreateTaskSchema.omit({ creatorId: true }).extend({
  creatorId: z.string().optional(),
  dueDate: TaskDueDateSchema.optional(),
});

export const UpdateTaskApiSchema = DomainUpdateTaskSchema;

export const ListTasksQueryApiSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  projectId: z.string().optional(),
  status: TaskStatusApiEnum.optional(),
  priority: TaskPriorityApiEnum.optional(),
  assigneeId: z.string().optional(),
  search: z.string().optional(),
});

export const CreateBookingApiSchema = CreateBookingPayloadSchema;
export const UpdateBookingApiSchema = ReschedulePayloadSchema;

// Backward-compatible aliases for consumers
export {
  CreateBookingApiSchema as CreateBookingSchema,
  UpdateBookingApiSchema as UpdateBookingSchema,
  CreateTeamApiSchema as CreateTeamSchema,
  UpdateTeamApiSchema as UpdateTeamSchema,
  AddTeamMemberApiSchema as AddTeamMemberSchema,
  CreateProjectApiSchema as CreateProjectSchema,
  UpdateProjectApiSchema as UpdateProjectSchema,
  CreateTaskApiSchema as CreateTaskSchema,
  UpdateTaskApiSchema as UpdateTaskSchema,
  ListTasksQueryApiSchema as ListTasksQuerySchema,
};
