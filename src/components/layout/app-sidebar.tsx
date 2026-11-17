"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarNav,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronsUpDown, Settings, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { formatPersonName, getPersonInitials } from "@/lib/format-person-name";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS, WORKSPACE_INFO } from "@/constants/navigation";
import { UserButton } from "@daveyplate/better-auth-ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { TasksNavItem } from "./tasks-nav-item";
import { useTeams, type TeamItem } from "@/hooks/use-teams";

function SidebarNavMenu({
  pathname,
  searchParams,
  teams,
}: {
  pathname: string;
  searchParams: Pick<URLSearchParams, "get">;
  teams: TeamItem[];
}) {
  const segments = pathname.split("/").filter(Boolean);
  const activeKey =
    pathname === "/" || segments[0] === "calendar"
      ? "calendar"
      : segments[0] || "calendar";

  return (
    <SidebarMenu className="gap-0.5">
      {MAIN_NAV_ITEMS.filter((item) => item.id !== "settings").map((item) => {
        const isActive = pathname
          ? item.id === activeKey || pathname === item.url
          : false;

        if (item.id === "tasks") {
          return (
            <TasksNavItem
              key={item.id}
              item={item}
              pathname={pathname}
              searchParams={searchParams}
              teams={teams}
            />
          );
        }

        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              isActive={isActive}
              tooltip={item.title}
              render={<Link href={item.url} />}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">
                {item.title}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function ActiveSidebarNavMenu({ teams }: { teams: TeamItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <SidebarNavMenu
      pathname={pathname}
      searchParams={searchParams}
      teams={teams}
    />
  );
}

const markMask = {
  mask: "url('/logo.svg') center / contain no-repeat",
  WebkitMask: "url('/logo.svg') center / contain no-repeat",
} as const;

const NO_PARAMS = new URLSearchParams();

const emptySubscribe = () => () => {};

/**
 * Account row for the library's dropdown. Ours, not UserView, so initials come from
 * first + last name ("AR"), the same as member rows, and the email sits in mono.
 */
function AccountTrigger({ className, ...props }: React.ComponentProps<"button">) {
  const { data, isPending } = authClient.useSession();
  // Session state differs between server and first client render; settle after mount.
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const user = mounted ? data?.user : undefined;
  const pending = !mounted || isPending;
  const title = user?.name || formatPersonName(null, user?.email);
  const initials = getPersonInitials(formatPersonName(user?.name, user?.email));

  return (
    <button
      type="button"
      aria-label="Account menu"
      className={cn(
        "flex w-full cursor-pointer items-center gap-1 rounded-md px-1 py-1.5 text-left ring-sidebar-ring outline-hidden transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 data-[state=open]:bg-sidebar-accent",
        className,
      )}
      {...props}
    >
      {pending ? (
        <Skeleton className="size-6 shrink-0 rounded-full" />
      ) : (
        <Avatar size="sm">
          {user?.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback className="text-foreground">
            {initials || <UserRound className="size-3.5" />}
          </AvatarFallback>
        </Avatar>
      )}
      <span className="grid min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        {pending ? (
          <>
            <Skeleton className="my-0.5 h-3.5 w-20" />
            <Skeleton className="my-0.5 h-3 w-28" />
          </>
        ) : (
          <>
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {title}
            </span>
            <span className="truncate font-code text-xs text-ink-3">
              {user?.email}
            </span>
          </>
        )}
      </span>
      <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
    </button>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Here (not in the nav) so the mobile sheet remounting doesn't refetch.
  const { teams } = useTeams();
  return (
    <Sidebar
      collapsible="icon"
      // The sidebar/content seam is the landing's dashed rail.
      className="border-r border-dashed border-sidebar-border bg-sidebar text-sidebar-foreground"
      {...props}
    >
      {/* Top section: Workspace brand header */}
      <SidebarHeader className="h-14 justify-center border-b border-dashed border-sidebar-border px-0 py-2 group-data-[collapsible=icon]:px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link prefetch={false} href="/calendar" />}
              className="h-10 text-sidebar-foreground hover:text-sidebar-foreground"
            >
              {/* Bare mark in ink, no tile: same treatment as the landing wordmark. */}
              <span
                aria-hidden
                className="size-5 shrink-0 bg-current"
                style={markMask}
              />
              <span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                {WORKSPACE_INFO.brand}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main navigation links */}
      <SidebarContent>
        <SidebarNav aria-label="Main" className="gap-0">
          {/* Rows run full-bleed to the rail; collapsed, they centre as 32px targets. */}
          <SidebarGroup className="px-0 py-1 group-data-[collapsible=icon]:px-2">
            <SidebarGroupLabel className="px-4">Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <React.Suspense
                fallback={
                  <SidebarNavMenu
                    pathname=""
                    searchParams={NO_PARAMS}
                    teams={[]}
                  />
                }
              >
                <ActiveSidebarNavMenu teams={teams} />
              </React.Suspense>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarNav>
      </SidebarContent>

      {/* Two tiers: Settings with its utilities on one row, then the account. */}
      <SidebarFooter className="gap-0 px-0 py-2 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1">
          <SidebarMenu className="min-w-0 flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Settings"
                render={<Link href="/settings" />}
              >
                <Settings />
                <span className="group-data-[collapsible=icon]:hidden">
                  Settings
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="flex shrink-0 items-center pr-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:pr-0">
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Star on GitHub (opens in a new tab)"
                    render={
                      <a
                        href="https://github.com/belastrittmatter/Scylla"
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  />
                }
              >
                <svg aria-hidden viewBox="0 0 24 24" className="fill-current">
                  <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
                </svg>
              </TooltipTrigger>
              <TooltipContent side="top">Star on GitHub</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Dashed hairline to the rail, then the account (avatar on the icon column). */}
        <div
          aria-hidden
          className="my-2 border-t border-dashed border-sidebar-border group-data-[collapsible=icon]:-mx-2"
        />
        <div className="px-2 group-data-[collapsible=icon]:px-0">
          <UserButton
            size="default"
            align="start"
            side="top"
            sideOffset={6}
            trigger={<AccountTrigger />}
            classNames={{
              content: {
                // Match the trigger's width and inset so the menu stays in the sidebar column.
                base: "w-(--radix-dropdown-menu-trigger-width) min-w-44 max-w-64",
                user: {
                  avatar: { base: "hidden" },
                  title: "font-medium",
                  subtitle: "font-code text-xs text-ink-3 opacity-100",
                },
              },
            }}
          />
        </div>
      </SidebarFooter>

      {/* Resizable / Toggle Rail */}
      <SidebarRail />
    </Sidebar>
  );
}
