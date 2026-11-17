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

const TAB_TRIGGER =
  "h-9 flex-none gap-2 rounded-none px-0 after:bg-primary group-data-horizontal/tabs:after:bottom-[-1px]";

/** Resource-tab count: a quiet mono figure beside the label, fed live by the tab. */
function TabCount({ value }: { value?: number }) {
  if (value === undefined) return null;
  return (
    <span className="text-muted-foreground font-mono text-xs font-normal tabular-nums">
      {value}
    </span>
  );
}

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
  // Server counts until a tab has loaded its own list, then the live length.
  const [memberCount, setMemberCount] = React.useState(team.memberCount);
  const [projectCount, setProjectCount] = React.useState(team.projectCount);

  React.useEffect(() => {
    setLabel(current.slug, current.name);
  }, [current.slug, current.name, setLabel]);

  const changeTab = (value: string) => {
    setTab(value as typeof tab);
    // History-only sync: router.replace would re-run the server page.
    window.history.replaceState(null, "", `${pathname}?tab=${value}`);
  };

  return (
    <div className="w-full max-w-4xl space-y-5 p-4 sm:p-6 md:p-8">
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
      <Tabs value={tab} onValueChange={changeTab} className="gap-5">
        {/* Resource tabs on the landing's dashed blueprint rule; ember marks the active one. */}
        <TabsList
          variant="line"
          className="border-border h-auto w-full justify-start gap-6 border-b border-dashed p-0 group-data-horizontal/tabs:h-auto"
        >
          <TabsTrigger value="members" className={TAB_TRIGGER}>
            Members
            <TabCount value={memberCount} />
          </TabsTrigger>
          <TabsTrigger value="projects" className={TAB_TRIGGER}>
            Projects
            <TabCount value={projectCount} />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <TeamMembersTab
            teamId={current.id}
            userId={userId}
            canManage={canManage}
            onCountChange={setMemberCount}
          />
        </TabsContent>
        <TabsContent value="projects">
          <TeamProjectsTab
            teamId={current.id}
            teamSlug={current.slug}
            canManage={canManage}
            onCountChange={setProjectCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
