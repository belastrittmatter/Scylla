import type { User } from "@/db/schema";
import type { TaskUser } from "./workspace-types";

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function toTaskUser(u: User): TaskUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    avatarUrl: u.image || "",
    initials: getInitials(u.name),
    role: u.role || "member",
  };
}
