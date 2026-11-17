"use client";

import { useEffect } from "react";
import { useBreadcrumb } from "@/components/layout/breadcrumb-context";
import { hasTeamRole, type TeamRole } from "@/services/team/team-types";
import { ProjectGithubCard } from "./project-github-card";
import { ProjectMembersCard } from "./project-members-card";
import { projectSettingsPageClass } from "./project-settings-skeleton";

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
    <div className={projectSettingsPageClass}>
      {/* The project leads, like the team page's h1; the crumb above ends in Settings. */}
      <header className="space-y-1">
        <h1 className="truncate text-xl font-semibold tracking-tight">
          {project.name}
        </h1>
        <p className="text-muted-foreground text-sm">{`Settings · ${team.name}`}</p>
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
