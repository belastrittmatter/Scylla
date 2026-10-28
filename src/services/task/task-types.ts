import { z } from "zod";
import type { Task } from "@/db/schema";

export const TaskStatusSchema = z.enum(["todo", "in_progress", "in_review", "done", "cancelled"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TaskDueDateSchema = z
  .union([
    z.date(),
    z.number(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format for dueDate",
    }),
  ])
  .transform((val) => (val instanceof Date ? val : new Date(val)))
  .refine((d) => !isNaN(d.getTime()), {
    message: "Invalid date for dueDate",
  });

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Task title cannot be empty").max(200),
  description: z.string().max(5000).optional(),
  status: TaskStatusSchema.default("todo"),
  priority: TaskPrioritySchema.default("medium"),
  teamId: z.string().min(1, "Team ID is required"),
  projectId: z.string().min(1).optional(),
  creatorId: z.string().min(1, "Creator ID is required"),
  assigneeId: z.string().nullable().optional(),
  dueDate: TaskDueDateSchema.nullable().optional(),
  position: z.number().int().nonnegative().optional(),
  estimatedMinutes: z.number().int().min(0).max(100000).nullable().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  projectId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: TaskDueDateSchema.nullable().optional(),
  position: z.number().int().nonnegative().optional(),
  estimatedMinutes: z.number().int().min(0).max(100000).nullable().optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const TaskFilterSchema = z.object({
  teamId: z.string().or(z.array(z.string())),
  projectId: z.string().optional(),
  status: TaskStatusSchema.or(z.array(TaskStatusSchema)).optional(),
  priority: TaskPrioritySchema.or(z.array(TaskPrioritySchema)).optional(),
  assigneeId: z.string().optional(),
  dueBefore: TaskDueDateSchema.optional(),
  overdue: z.boolean().optional(),
});
export type TaskFilterInput = z.infer<typeof TaskFilterSchema>;

export interface TaskWithRelations extends Task {
  creator?: { id: string; name: string; email: string; image?: string | null };
  assignee?: { id: string; name: string; email: string; image?: string | null } | null;
  project?: { id: string; name: string; slug: string; color?: string | null } | null;
}

export type {
  TaskUser,
  TaskWithDetails,
  WorkspaceData,
  WorkspaceTeamMember,
} from "./workspace-types";
