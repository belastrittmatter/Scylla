"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { WORKSPACE_INFO } from "@/constants/navigation";
import { Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useBreadcrumb } from "./breadcrumb-context";

function formatSegment(segment: string): string {
  const customMap: Record<string, string> = {
    calendar: "Calendar",
    tasks: "Tasks",
    projects: "Projects",
    teams: "Teams",
    settings: "Settings",
    support: "Support",
    "custom-css": "Custom CSS",
  };
  const decoded = decodeURIComponent(segment).toLowerCase();
  if (customMap[decoded]) {
    return customMap[decoded];
  }
  return decodeURIComponent(segment)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ViewHeaderProps {
  title?: string;
  parent?: string;
}

function DynamicBreadcrumbSegments({ title }: { title?: string }) {
  const pathname = usePathname();
  const { customLabels } = useBreadcrumb();

  const rawSegments = pathname ? pathname.split("/").filter(Boolean) : [];
  const segments = rawSegments.length > 0 ? rawSegments : ["calendar"];

  const items = segments.map((seg, index) => {
    const path =
      rawSegments.length === 0
        ? "/"
        : "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const custom = customLabels[seg] || customLabels[decodeURIComponent(seg)];
    const label = isLast && title ? title : custom || formatSegment(seg);
    return { path, label };
  });

  return (
    <>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        return isLast ? (
          <BreadcrumbItem key={item.path}>
            <BreadcrumbPage className="font-medium text-neutral-800 dark:text-neutral-100">
              {item.label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <React.Fragment key={item.path}>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link href={item.path} />}
                className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                {item.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-neutral-300 dark:text-neutral-700" />
          </React.Fragment>
        );
      })}
    </>
  );
}

export function ViewHeader({
  title,
  parent = WORKSPACE_INFO.brand,
}: ViewHeaderProps) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/[0.06] bg-white/80 px-5 py-3 backdrop-blur-md transition-colors dark:border-white/[0.08] dark:bg-neutral-900/80">
      <div className="flex items-center gap-1.5">
        <SidebarTrigger className="-ml-1 text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200" />

        <div className="mx-1 h-3 w-px bg-neutral-200 dark:bg-neutral-800" />

        <Breadcrumb>
          <BreadcrumbList className="text-[13px] font-normal">
            {/* Root item: Brand (Scylla) */}
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link href="/" />}
                className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                {parent}
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator className="text-neutral-300 dark:text-neutral-700" />

            {/* Dynamic path segments */}
            <React.Suspense fallback={null}>
              <DynamicBreadcrumbSegments title={title} />
            </React.Suspense>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <Link
          href="/settings"
          className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="size-4" />
        </Link>
      </div>
    </div>
  );
}
