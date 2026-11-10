"use client";

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
): string | null {
  const [pathTeam] = pathname.replace(/^\/tasks\/?/, "").split("/");
  if (pathTeam) return pathTeam.toLowerCase();
  const team = searchParams.get("team");
  return searchParams.get("scope") === "team" && team
    ? team.toLowerCase()
    : null;
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
  const activeTeam = onTasks ? activeTasksTeam(pathname, searchParams) : null;

  return (
    <Collapsible defaultOpen={onTasks} render={<SidebarMenuItem />}>
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
