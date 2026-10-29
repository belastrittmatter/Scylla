import * as z from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .describe("Team workspace name (e.g. 'Engineering', 'Marketing')"),
  slug: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe("Custom URL slug. If omitted, generated from name"),
  description: z
    .string()
    .max(500)
    .optional()
    .describe("Brief description of the team workspace"),
});

export const getTeamSchema = z.object({
  teamId: z.string().min(1).describe("Team ID or slug"),
});

export const updateTeamSchema = z.object({
  teamId: z.string().min(1).describe("Team ID or slug to update"),
  name: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe("Updated team workspace name"),
  slug: z.string().min(1).max(100).optional().describe("Updated team URL slug"),
  description: z
    .string()
    .max(500)
    .optional()
    .describe("Updated team description"),
});

export const deleteTeamSchema = z.object({
  teamId: z.string().min(1).describe("Team ID or slug to delete"),
});

export const addTeamMemberSchema = z.object({
  teamId: z.string().min(1).describe("Team ID or slug"),
  userId: z.string().optional().describe("User ID of the member to add"),
  email: z
    .string()
    .optional()
    .describe("Email address or nickname of user to invite/add"),
  role: z
    .enum(["owner", "admin", "member", "viewer"])
    .optional()
    .default("member")
    .describe("Role to assign (owner, admin, member, viewer; default: member)"),
});

export const removeTeamMemberSchema = z.object({
  teamId: z.string().min(1).describe("Team ID or slug"),
  userId: z
    .string()
    .describe("User ID, email, or nickname of the member to remove"),
});

export const updateTeamMemberRoleSchema = z.object({
  teamId: z.string().min(1).describe("Team ID or slug"),
  userId: z.string().describe("User ID, email, or nickname of the member"),
  role: z
    .enum(["owner", "admin", "member", "viewer"])
    .describe("New role to assign to the member"),
});

export const getProjectSchema = z.object({
  projectId: z.string().describe("Project ID to retrieve"),
  teamId: z
    .string()
    .optional()
    .describe("Optional Team ID or slug if resolving by slug"),
});

export const updateProjectSchema = z.object({
  projectId: z.string().describe("Project ID to update"),
  name: z.string().min(1).max(100).optional().describe("New project name"),
  slug: z.string().min(1).max(100).optional().describe("New project slug"),
  description: z
    .string()
    .max(1000)
    .optional()
    .describe("New project description"),
  status: z
    .enum(["planning", "active", "paused", "completed", "archived"])
    .optional()
    .describe("New project status"),
  color: z
    .string()
    .optional()
    .describe("New project accent color hex code (e.g. '#3b82f6')"),
});

export const deleteProjectSchema = z.object({
  projectId: z.string().describe("Project ID to delete"),
});

export const getTaskSchema = z.object({
  taskId: z.string().describe("Task ID to retrieve"),
});

export const deleteTaskSchema = z.object({
  taskId: z.string().describe("Task ID to delete"),
});

export const addTaskCommentSchema = z.object({
  taskId: z.string().describe("Task ID to comment on"),
  content: z.string().min(1).describe("Comment content / message text"),
});

export const listTaskCommentsSchema = z.object({
  taskId: z.string().describe("Task ID to retrieve comments for"),
});
