import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ProjectSettingsView } from "@/components/projects/settings/project-settings-view";
import { TeamsPageSkeleton } from "@/components/teams/teams-page-skeleton";
import { getCurrentUserId, loadTeamForMember } from "@/lib/team-pages";
import { ProjectService } from "@/services/project/project-service";

export const metadata = { title: "Project Settings | Scylla MCP" };

interface Props {
  params: Promise<{ id: string }>;
}

// cacheComponents: request-time data must render inside a Suspense boundary.
export default function ProjectSettingsPage(props: Props) {
  return (
    <Suspense fallback={<TeamsPageSkeleton />}>
      <ProjectSettingsContent {...props} />
    </Suspense>
  );
}

async function ProjectSettingsContent({ params }: Props) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/sign-in");
  const project = await ProjectService.getProjectById(id);
  if (!project) notFound();
  const found = await loadTeamForMember(project.teamId, userId);
  if (!found) notFound();
  return (
    <ProjectSettingsView
      project={{
        id,
        name: project.name,
        slug: project.slug,
        color: project.color,
        githubRepo: project.githubRepo,
      }}
      team={{ id: found.team.id, name: found.team.name, slug: found.team.slug }}
      role={found.role}
      userId={userId}
    />
  );
}
