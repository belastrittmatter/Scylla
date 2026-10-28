import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TeamProjectsView } from "@/components/projects";
import { TeamService } from "@/services";

interface TeamProjectsPageProps {
  params: Promise<{ slug: string }>;
}

async function TeamProjectsContent({ params }: TeamProjectsPageProps) {
  const { slug } = await params;

  let team = await TeamService.getTeamBySlug(slug);
  if (!team) {
    team = await TeamService.getTeamById(slug);
  }

  if (!team) {
    notFound();
  }

  return (
    <TeamProjectsView
      team={{
        id: team.id,
        name: team.name,
        slug: team.slug,
        description: team.description,
      }}
    />
  );
}

export default function TeamProjectsPage(props: TeamProjectsPageProps) {
  return (
    <Suspense fallback={null}>
      <TeamProjectsContent params={props.params} />
    </Suspense>
  );
}
