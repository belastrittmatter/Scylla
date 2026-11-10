import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TeamsView } from "@/components/teams/teams-view";
import { getCurrentUserId, loadTeamSummaries } from "@/lib/team-pages";
import { TeamsPageSkeleton } from "@/components/teams/teams-page-skeleton";

export const metadata = { title: "Teams | Scylla MCP" };

// cacheComponents: request-time data must render inside a Suspense boundary.
export default function TeamsPage() {
  return (
    <Suspense fallback={<TeamsPageSkeleton />}>
      <TeamsContent />
    </Suspense>
  );
}

async function TeamsContent() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/sign-in");
  return <TeamsView initialTeams={await loadTeamSummaries(userId)} />;
}
