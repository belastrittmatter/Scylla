import { redirect } from "next/navigation";
import { ProjectService } from "@/services/project/project-service";
import { TeamService } from "@/services/team/team-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectRedirectPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) {
    redirect("/tasks");
  }

  const project = await ProjectService.getProjectById(id);
  if (!project) {
    redirect("/tasks");
  }

  const team = await TeamService.getTeamById(project.teamId);
  if (team?.slug && project.slug) {
    redirect(`/tasks/${team.slug}/${project.slug}`);
  }

  redirect("/tasks");
}
