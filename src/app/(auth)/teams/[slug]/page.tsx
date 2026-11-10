import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { TeamDetailView } from "@/components/teams/team-detail-view";
import { getCurrentUserId, loadTeamForMember } from "@/lib/team-pages";
import { TeamsPageSkeleton } from "@/components/teams/teams-page-skeleton";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

// cacheComponents: request-time data must render inside a Suspense boundary.
export default function TeamDetailPage(props: Props) {
  return (
    <Suspense fallback={<TeamsPageSkeleton />}>
      <TeamDetailContent {...props} />
    </Suspense>
  );
}

async function TeamDetailContent({ params, searchParams }: Props) {
  const [{ slug }, { tab }] = await Promise.all([params, searchParams]);
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/sign-in");
  const found = await loadTeamForMember(slug, userId);
  if (!found) notFound();
  return (
    <TeamDetailView
      team={found.team}
      role={found.role}
      userId={userId}
      initialTab={tab === "projects" ? "projects" : "members"}
    />
  );
}
