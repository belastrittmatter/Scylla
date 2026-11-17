import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ProjectSettingsSkeleton } from "@/components/projects/settings/project-settings-skeleton";
import { ProjectSettingsView } from "@/components/projects/settings/project-settings-view";
import { getCurrentUserId } from "@/lib/team-pages";
import { loadProjectForMember } from "@/lib/project-pages";

interface Props {
  params: Promise<{ id: string }>;
}

// cacheComponents: request-time data must render inside a Suspense boundary.
export default function ProjectSettingsPage(props: Props) {
  return (
    <Suspense fallback={<ProjectSettingsSkeleton />}>
      <ProjectSettingsContent {...props} />
    </Suspense>
  );
}

async function ProjectSettingsContent({ params }: Props) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/sign-in");
  const found = await loadProjectForMember(id, userId);
  if (!found) notFound();
  return (
    <ProjectSettingsView
      project={found.project}
      team={found.team}
      role={found.role}
    />
  );
}
