"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Settings } from "lucide-react";
import { MAIN_NAV_ITEMS, WORKSPACE_INFO } from "@/constants/navigation";
import { UserButton } from "@daveyplate/better-auth-ui";

function SidebarNavMenu({ pathname }: { pathname: string }) {
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

        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              isActive={isActive}
              tooltip={item.title}
              className="h-9 rounded-lg text-[13px] font-normal tracking-[-0.01em] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground"
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

function ActiveSidebarNavMenu() {
  const pathname = usePathname();
  return <SidebarNavMenu pathname={pathname} />;
}

const markMask = {
  mask: "url('/logo.svg') center / contain no-repeat",
  WebkitMask: "url('/logo.svg') center / contain no-repeat",
} as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      {...props}
    >
      {/* Top section: Workspace brand header */}
      <SidebarHeader className="border-b border-sidebar-border p-2 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link prefetch={false} href="/calendar" />}
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0!"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                <span
                  aria-hidden
                  className="size-5 bg-current"
                  style={markMask}
                />
              </div>

              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold">
                  {WORKSPACE_INFO.brand}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  Workspace
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main navigation links */}
      <SidebarContent>
        <SidebarGroup className="py-1">
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <React.Suspense fallback={<SidebarNavMenu pathname="" />}>
              <ActiveSidebarNavMenu />
            </React.Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Bottom navigation links & user info card */}
      <SidebarFooter className="gap-2 border-t border-sidebar-border p-2">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              className="h-9 rounded-lg text-[13px] font-normal tracking-[-0.01em] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              render={<Link href="/settings" />}
            >
              <Settings className="size-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">
                Settings
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="GitHub"
              className="h-9 rounded-lg text-[13px] font-normal tracking-[-0.01em] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              render={
                <a
                  href="https://github.com/belastrittmatter/Scylla"
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-4 shrink-0 fill-current"
              >
                <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
              </svg>
              <span className="group-data-[collapsible=icon]:hidden">
                GitHub
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="mx-0" />

        <UserButton
          variant="ghost"
          className="w-full cursor-pointer justify-start transition-colors hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
        />
      </SidebarFooter>

      {/* Resizable / Toggle Rail */}
      <SidebarRail />
    </Sidebar>
  );
}
