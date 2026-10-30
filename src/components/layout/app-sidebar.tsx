"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
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
              className="h-8.5 data-active:font-semibold data-active:text-neutral-900 data-active:bg-neutral-200/80 dark:data-active:text-neutral-50 dark:data-active:bg-neutral-800/90 text-[13px] font-normal tracking-[-0.01em] text-neutral-600 transition-colors hover:bg-neutral-200/50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100"
              render={<Link href={item.url} />}
            >
              <item.icon className="size-4 shrink-0 text-neutral-500 group-data-[active=true]:text-neutral-900 dark:text-neutral-400 dark:group-data-[active=true]:text-orange-400" />
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="!border-r-0 dark:bg-neutral-950"
      {...props}
    >
      {/* Top section: Workspace brand header */}
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* NOTE: Must use window.location.replace instead of Next.js client-side navigation because Next.js caches CSS across route transitions, causing style conflicts between the dashboard and landing page. */}
            <SidebarMenuButton
              size="lg"
              render={
                <Link
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.replace("/");
                  }}
                />
              }
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0!"
            >
              {/* Collapsed sidebar icon: small logo mark as before */}
              <div className="hidden aspect-square size-8 items-center justify-center group-data-[collapsible=icon]:flex">
                <Image
                  src={WORKSPACE_INFO.logoUrl}
                  alt={WORKSPACE_INFO.brand}
                  width={20}
                  height={20}
                  priority
                  className="size-5 object-contain dark:invert"
                />
              </div>

              {/* Expanded sidebar logo: long Scylla logo from landing with proper light/dark mode */}
              <div className="flex flex-1 items-center group-data-[collapsible=icon]:hidden">
                <img
                  src="/images/logo.svg"
                  alt={WORKSPACE_INFO.brand}
                  className="h-5.5 w-auto object-contain invert dark:invert-0"
                />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main navigation links */}
      <SidebarContent>
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <React.Suspense fallback={<SidebarNavMenu pathname="" />}>
              <ActiveSidebarNavMenu />
            </React.Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Bottom navigation links & user info card */}
      <SidebarFooter className="gap-2 p-2">
        <UserButton
          variant="ghost"
          className="w-full cursor-pointer justify-start transition-colors hover:bg-neutral-200/60 data-[state=open]:bg-neutral-200/80 dark:hover:bg-neutral-800/80 dark:data-[state=open]:bg-neutral-800"
        />
      </SidebarFooter>

      {/* Resizable / Toggle Rail */}
      <SidebarRail />
    </Sidebar>
  );
}
