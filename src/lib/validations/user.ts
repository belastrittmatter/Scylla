import { z } from "zod";

export const userNameSchema = z
  .string()
  .trim()
  .min(1, { message: "Name cannot be empty." })
  .max(32, { message: "Please use 32 characters at maximum." });

export type UserNameInput = z.infer<typeof userNameSchema>;
