import { ProjectService } from "@/services/project/project-service";
import { TeamService } from "@/services/team/team-service";
import type { TeamRole } from "@/services/team/team-types";

/** Project with its team and the user's role, only if the user belongs to that team. */
export async function loadProjectForMember(
  projectId: string,
  userId: string,
): Promise<{
  project: {
    id: string;
    name: string;
    slug: string;
    teamId: string;
    githubRepo: string | null;
  };
  team: { id: string; name: string; slug: string };
  role: TeamRole;
} | null> {
  const found = await ProjectService.getProjectById(projectId);
  if (!found) return null;
  const [role, team] = await Promise.all([
    TeamService.getUserRole(found.teamId, userId),
    TeamService.getTeamById(found.teamId),
  ]);
  if (!role || !team) return null;
  return {
    project: {
      id: found.id,
      name: found.name,
      slug: found.slug,
      teamId: found.teamId,
      githubRepo: found.githubRepo,
    },
    team: { id: team.id, name: team.name, slug: team.slug },
    role,
  };
}
