import type { Team, Project, Task } from "@/db/schema";

export interface TaskUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  avatarUrl?: string;
  initials?: string;
  role: string;
}

export interface WorkspaceTeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
}

export interface TaskWithDetails extends Task {
  assignee?: TaskUser | null;
  creator?: TaskUser | null;
  project?: Project | null;
  totalSpentSeconds?: number;
  activeSessionStartedAt?: string | null;
}

export interface WorkspaceData {
  teams: Team[];
  projects: Project[];
  tasks: TaskWithDetails[];
  users: TaskUser[];
  teamMembers?: WorkspaceTeamMember[];
}
