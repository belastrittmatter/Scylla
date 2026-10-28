import { z } from "zod";

export const ProjectStatusSchema = z.enum([
  "planning",
  "active",
  "paused",
  "completed",
  "archived",
]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name cannot be empty").max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  teamId: z.string().min(1, "Team ID is required"),
  status: ProjectStatusSchema.default("active").optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color")
    .optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  status: ProjectStatusSchema.optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .nullable()
    .optional(),
});
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

export const ProjectFilterSchema = z.object({
  status: ProjectStatusSchema.optional(),
});
export type ProjectFilterInput = z.infer<typeof ProjectFilterSchema>;
