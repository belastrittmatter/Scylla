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
} from "@/components/ui/sidebar";
import { ChevronDown } from "lucide-react";
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
      {MAIN_NAV_ITEMS.map((item) => {
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
      <SidebarHeader className="p-2">
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
        <div className="relative">
          <UserButton
            variant="ghost"
            className="w-full cursor-pointer justify-start pr-8 transition-colors hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
          />
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-sidebar-foreground/60"
          />
        </div>
      </SidebarFooter>

      {/* Resizable / Toggle Rail */}
      <SidebarRail />
    </Sidebar>
  );
}
