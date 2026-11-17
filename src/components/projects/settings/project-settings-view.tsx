"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useBreadcrumb } from "@/components/layout/breadcrumb-context";
import { buildTasksUrl } from "@/components/tasks/use-task-workspace-routing";
import { canManageTeam } from "@/components/teams/team-roles";
import { TeamMembersTab } from "@/components/teams/team-members-tab";
import { Button } from "@/components/ui/button";
import type { TeamRole } from "@/services/team/team-types";
import { ProjectGithubCard } from "./project-github-card";

export interface ProjectSettingsViewProps {
  project: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    githubRepo: string | null;
  };
  team: { id: string; name: string; slug: string };
  role: TeamRole;
  userId: string;
}

interface SyncResult {
  repository: string;
  createdCount: number;
  updatedCount: number;
  totalIssues: number;
}

export function ProjectSettingsView({
  project,
  team,
  role,
  userId,
}: ProjectSettingsViewProps) {
  const { setLabel } = useBreadcrumb();
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    setLabel(project.id, project.name);
  }, [setLabel, project.id, project.name]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/github-sync`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => ({}))) as
        Partial<SyncResult> | { error?: string };
      if (!res.ok) {
        const error = (json as { error?: string }).error;
        toast.error(error || "Failed to sync GitHub issues");
        return;
      }
      const r = json as SyncResult;
      toast.success(
        `Synced ${r.totalIssues} issues from ${r.repository} (${r.createdCount} new, ${r.updatedCount} updated)`,
      );
    } catch {
      toast.error("Failed to sync GitHub issues");
    } finally {
      setIsSyncing(false);
    }
  };

  const boardHref = buildTasksUrl({
    scope: "team",
    team: team.slug,
    project: project.slug,
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{`${project.name} Settings`}</h1>
          <p className="text-muted-foreground text-sm">{team.name}</p>
        </div>
        <Button variant="outline" size="sm" render={<Link href={boardHref} />}>
          <ArrowLeft />
          Back to board
        </Button>
      </div>
      <ProjectGithubCard
        githubRepo={project.githubRepo}
        canSync={role !== "viewer"}
        isSyncing={isSyncing}
        onSync={handleSync}
      />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Team Members</h2>
        <TeamMembersTab
          teamId={team.id}
          userId={userId}
          canManage={canManageTeam(role)}
        />
      </section>
    </div>
  );
}
