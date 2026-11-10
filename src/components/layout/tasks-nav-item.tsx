"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { buildTasksUrl } from "@/components/tasks/use-task-workspace-routing";
import type { NavItem } from "@/constants/navigation";
import type { TeamItem } from "@/hooks/use-teams";

/** Slug of the team the URL points at, or null for My tasks. */
export function activeTasksTeam(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">,
  teams?: Array<{ id: string; slug: string }>,
): string | null {
  const [pathTeam] = pathname
    .replace(/^\/tasks\/?/, "")
    .split("/")
    .filter(Boolean);
  if (pathTeam) return pathTeam.toLowerCase();

  const rawScope = searchParams.get("scope");
  const teamRef = searchParams.get("team") ?? searchParams.get("teamId");

  const isTeamScope =
    (rawScope ?? (teamRef ? "team" : "me")) === "team" && Boolean(teamRef);
  if (!isTeamScope || !teamRef) return null;

  if (teams && teams.length > 0) {
    const matched = teams.find(
      (t) =>
        t.slug.toLowerCase() === teamRef.toLowerCase() ||
        t.id.toLowerCase() === teamRef.toLowerCase(),
    );
    if (matched) return matched.slug.toLowerCase();
  }

  return teamRef.toLowerCase();
}

const buttonClass =
  "h-9 rounded-lg text-[13px] font-normal tracking-[-0.01em] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground";

export function TasksNavItem({
  item,
  pathname,
  searchParams,
  teams,
}: {
  item: NavItem;
  pathname: string;
  searchParams: Pick<URLSearchParams, "get">;
  teams: TeamItem[];
}) {
  const onTasks = pathname === "/tasks" || pathname.startsWith("/tasks/");
  const activeTeam = onTasks
    ? activeTasksTeam(pathname, searchParams, teams)
    : null;
  // Controlled: pathname starts empty (Suspense fallback), so defaultOpen would change after mount.
  const [open, setOpen] = React.useState(onTasks);
  const [wasOnTasks, setWasOnTasks] = React.useState(onTasks);
  if (wasOnTasks !== onTasks) {
    setWasOnTasks(onTasks);
    if (onTasks) setOpen(true);
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      render={<SidebarMenuItem />}
    >
      <SidebarMenuButton
        isActive={onTasks}
        tooltip={item.title}
        className={buttonClass}
        render={<Link href={item.url} />}
      >
        <item.icon className="size-4 shrink-0" />
        <span className="group-data-[collapsible=icon]:hidden">
          {item.title}
        </span>
      </SidebarMenuButton>
      <CollapsibleTrigger
        render={
          <SidebarMenuAction
            aria-label="Toggle task shortcuts"
            className="top-2 data-panel-open:[&>svg]:rotate-90"
          />
        }
      >
        <ChevronRight className="transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton
              isActive={onTasks && !activeTeam}
              render={<Link href={buildTasksUrl({ scope: "me" })} />}
            >
              <span>My tasks</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
          {teams.map((team) => (
            <SidebarMenuSubItem key={team.id}>
              <SidebarMenuSubButton
                isActive={activeTeam === team.slug.toLowerCase()}
                render={
                  <Link
                    href={buildTasksUrl({ scope: "team", team: team.slug })}
                  />
                }
              >
                <span>{team.name}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}
