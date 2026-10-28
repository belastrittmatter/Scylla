import { z } from "zod";

export const RoomFilterSchema = z
  .object({
    minCapacity: z.number().int().nonnegative().optional(),
    features: z.array(z.string()).optional(),
    building: z.string().optional(),
  })
  .optional();

export const FindSlotsParamsSchema = z
  .object({
    attendees: z.array(z.string()).min(1, "At least one attendee is required"),
    durationMinutes: z.number().int().positive().optional().default(30),
    startDate: z.union([z.string(), z.date()]),
    endDate: z.union([z.string(), z.date()]),
    eventTypeId: z.string().optional(),
    roomId: z.string().optional(),
    beforeBuffer: z.number().int().nonnegative().optional(),
    afterBuffer: z.number().int().nonnegative().optional(),
    timeZone: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end;
    },
    {
      message: "startDate must be before endDate and valid dates",
      path: ["startDate"],
    }
  );

export const GetAgendaParamsSchema = z.object({
  dateIso: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Invalid date format for dateIso",
  }),
  userId: z.string().min(1).optional(),
});

export const CreateBookingPayloadSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    eventTypeId: z.string().optional(),
    organizerUserId: z.string().min(1).optional(),
    roomId: z.string().optional(),
    projectId: z.string().nullable().optional(),
    startTime: z.union([z.string(), z.date()]),
    endTime: z.union([z.string(), z.date()]),
    attendees: z
      .array(
        z.union([
          z.string(),
          z.object({
            email: z.string().email(),
            name: z.string().optional(),
            status: z.string().optional(),
          }),
        ])
      )
      .optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end;
    },
    {
      message: "startTime must be before endTime and valid dates",
      path: ["startTime"],
    }
  );

export const ReschedulePayloadSchema = z
  .object({
    startTime: z.union([z.string(), z.date()]).optional(),
    endTime: z.union([z.string(), z.date()]).optional(),
    roomId: z.string().optional(),
    projectId: z.string().nullable().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end;
      }
      return true;
    },
    {
      message: "startTime must be before endTime and valid dates",
      path: ["startTime"],
    }
  );

export const UpdateTaskStatusSchema = z.object({
  status: z.enum(["todo", "in_progress", "in_review", "done", "cancelled"]),
});

export const UpdateTaskPayloadSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.union([z.string(), z.date()]).nullable().optional(),
  position: z.number().int().optional(),
  estimatedMinutes: z.number().int().min(0).max(100000).nullable().optional(),
});

export const CreateProjectPayloadSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  name: z.string().min(1, "Project name is required"),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

export const CreateTaskPayloadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  teamId: z.string().min(1, "Team ID is required"),
  projectId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.union([z.string(), z.date()]).nullable().optional(),
  estimatedMinutes: z.number().int().min(0).max(100000).nullable().optional(),
});

export const CreateTaskCommentPayloadSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  content: z.string().min(1, "Comment content cannot be empty"),
});
