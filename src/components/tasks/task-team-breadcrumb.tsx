"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import {
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EntityCombobox } from "@/components/ui/entity-combobox";
import { ProjectDot } from "@/components/projects/project-dot";
import type { Project, Team } from "./task-types";

const CRUMB = "h-7 max-w-28 px-1.5 font-medium xl:max-w-44";

interface TaskTeamBreadcrumbProps {
  teams: Team[];
  /** Projects of the selected team. */
  projects: Project[];
  team: Team | undefined;
  project: Project | undefined;
  onSelectTeam: (team: Team) => void;
  /** `undefined` selects All projects. */
  onSelectProject: (project: Project | undefined) => void;
  onCreateTeam: () => void;
}

/** `Team ▾ / Project ▾` breadcrumb items (Team scope); render inside a BreadcrumbList. */
export function TaskTeamBreadcrumb({
  teams,
  projects,
  team,
  project,
  onSelectTeam,
  onSelectProject,
  onCreateTeam,
}: TaskTeamBreadcrumbProps) {
  return (
    <>
      <BreadcrumbItem>
        <EntityCombobox
          items={teams}
          getKey={(t) => t.id}
          getLabel={(t) => t.name}
          searchFields={(t) => [t.name, t.slug, t.description]}
          selected={team ?? null}
          onSelect={(t) => t && onSelectTeam(t)}
          placeholder="Select team"
          // A bare text node in the flex trigger cannot show an ellipsis.
          renderItem={(t) => <span className="truncate">{t.name}</span>}
          searchPlaceholder="Search teams..."
          emptyText="No teams found."
          variant="ghost"
          className={CRUMB}
          footer={(close) => (
            <>
              {team && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  render={<Link href={`/teams/${team.slug}`} />}
                  onClick={close}
                >
                  <Settings />
                  Manage team
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  close();
                  onCreateTeam();
                }}
              >
                <Plus />
                New team
              </Button>
            </>
          )}
        />
      </BreadcrumbItem>
      {/* Quiet "/" so the picker's ▾ isn't followed by a second chevron. */}
      <BreadcrumbSeparator className="text-muted-foreground/50">
        /
      </BreadcrumbSeparator>
      <BreadcrumbItem>
        <EntityCombobox
          items={projects}
          getKey={(p) => p.id}
          getLabel={(p) => p.name}
          searchFields={(p) => [p.name, p.slug, p.description]}
          selected={project ?? null}
          onSelect={(p) => onSelectProject(p ?? undefined)}
          placeholder="All projects"
          searchPlaceholder="Search projects..."
          emptyText="No projects found."
          clearOption={{ label: "All projects" }}
          variant="ghost"
          // Icon-only below md (label stays for screen readers).
          className={cn(CRUMB, "max-md:[&>span:first-child]:sr-only")}
          renderItem={(p) => (
            <>
              <ProjectDot color={p.color} />
              <span className="truncate">{p.name}</span>
            </>
          )}
        />
      </BreadcrumbItem>
    </>
  );
}
