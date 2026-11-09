import type { ProjectStatus } from "@/services/project/project-types";

export const COLOR_PRESETS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ef4444", // Rose
  "#06b6d4", // Cyan
  "#64748b", // Slate
];

export interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  color: string | null;
  githubRepo: string | null;
  teamId: string;
  team?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  teamRole: string;
  githubConnected: boolean;
  githubUsername: string | null;
}

export async function fetchProjectTeamMembers(
  teamId: string,
): Promise<TeamMemberItem[]> {
  try {
    const res = await fetch("/api/users");
    if (!res.ok) return [];
    const usersData = await res.json();
    if (!Array.isArray(usersData)) return [];

    return usersData
      .filter((u: { teams?: Array<{ teamId: string; role: string }> }) =>
        u.teams?.some((t) => t.teamId === teamId),
      )
      .map(
        (u: {
          id: string;
          name: string;
          email: string;
          image: string | null;
          role?: string;
          teams?: Array<{ teamId: string; role: string }>;
          githubConnected?: boolean;
          githubUsername?: string | null;
        }) => {
          const teamEntry = u.teams?.find((t) => t.teamId === teamId);
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            image: u.image,
            teamRole: teamEntry?.role || u.role || "member",
            githubConnected: !!u.githubConnected,
            githubUsername: u.githubUsername || null,
          };
        },
      );
  } catch {
    return [];
  }
}
