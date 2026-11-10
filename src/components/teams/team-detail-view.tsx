"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBreadcrumb } from "@/components/layout/breadcrumb-context";
import { TeamProjectsTab } from "@/components/projects/team-projects-tab";
import { useTeams, type TeamItem } from "@/hooks/use-teams";
import type { TeamRole } from "@/services/team/team-types";
import { TeamHeader } from "./team-header";
import { TeamMembersTab } from "./team-members-tab";
import { canManageTeam } from "./team-roles";
import { invalidateTaskWorkspaceCache } from "@/components/tasks/use-task-workspace-data";

type Props = {
  team: TeamItem;
  role: TeamRole;
  userId: string;
  initialTab: "members" | "projects";
};

export function TeamDetailView({ team, role, userId, initialTab }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { setLabel } = useBreadcrumb();
  const { teams, updateTeam, deleteTeam } = useTeams([team]);
  const current = teams[0] ?? team;
  const canManage = canManageTeam(role);
  const [tab, setTab] = React.useState(initialTab);

  React.useEffect(() => {
    setLabel(current.slug, current.name);
  }, [current.slug, current.name, setLabel]);

  const changeTab = (value: string) => {
    setTab(value as typeof tab);
    // History-only sync: router.replace would re-run the server page.
    window.history.replaceState(null, "", `${pathname}?tab=${value}`);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 md:p-8">
      <TeamHeader
        team={current}
        canManage={canManage}
        canDelete={current.ownerId === userId}
        onUpdate={async (id, data) => {
          const updated = await updateTeam(id, data);
          if (updated.slug !== team.slug) {
            invalidateTaskWorkspaceCache();
            router.replace(`/teams/${updated.slug}?tab=${tab}`);
          }
          return updated;
        }}
        onDelete={async () => {
          await deleteTeam(current.id);
          invalidateTaskWorkspaceCache();
          router.push("/teams");
        }}
      />
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <TeamMembersTab
            teamId={current.id}
            userId={userId}
            canManage={canManage}
          />
        </TabsContent>
        <TabsContent value="projects">
          <TeamProjectsTab
            teamId={current.id}
            teamSlug={current.slug}
            canManage={canManage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
