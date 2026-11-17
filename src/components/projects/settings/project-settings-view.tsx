"use client";

import { useEffect } from "react";
import { useBreadcrumb } from "@/components/layout/breadcrumb-context";
import { hasTeamRole, type TeamRole } from "@/services/team/team-types";
import { ProjectGithubCard } from "./project-github-card";
import { ProjectMembersCard } from "./project-members-card";

type Props = {
  project: {
    id: string;
    name: string;
    slug: string;
    teamId: string;
    githubRepo: string | null;
  };
  team: { id: string; name: string; slug: string };
  role: TeamRole;
};

export function ProjectSettingsView({ project, team, role }: Props) {
  const { setLabel } = useBreadcrumb();

  // The URL segment is the project id; show the project's name in the crumb.
  useEffect(() => {
    setLabel(project.id, project.name);
  }, [project.id, project.name, setLabel]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Project Settings</h1>
        <p className="text-muted-foreground text-sm">
          {project.name} · {team.name}
        </p>
      </header>
      <ProjectGithubCard
        projectId={project.id}
        githubRepo={project.githubRepo}
        canSync={hasTeamRole(role, "member")}
      />
      <ProjectMembersCard
        teamId={project.teamId}
        canManage={hasTeamRole(role, "admin")}
      />
    </div>
  );
}
