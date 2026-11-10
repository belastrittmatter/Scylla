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
        ? "/calendar"
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
            <BreadcrumbPage className="font-medium text-foreground">
              {item.label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <React.Fragment key={item.path}>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link href={item.path} />}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground/50" />
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
  const { setHeaderSlot } = useBreadcrumb();
  return (
    <div className="group/header sticky top-0 z-20 flex min-h-14 flex-wrap items-center gap-x-1.5 gap-y-2 border-b border-border bg-background px-5 py-2 transition-colors">
      <SidebarTrigger className="-ml-1 text-muted-foreground transition-colors hover:text-foreground" />

      <div className="mx-1 h-3 w-px bg-border" />

      {/* Pages that fill the HeaderSlot bring their own breadcrumb. */}
      <Breadcrumb className="group-has-[[data-header-slot]>*]/header:hidden">
        <BreadcrumbList className="text-[13px] font-normal">
          {/* Root item: Brand (Scylla) */}
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href="/calendar" />}
              className="text-muted-foreground hover:text-foreground"
            >
              {parent}
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator className="text-muted-foreground/50" />

          {/* Dynamic path segments */}
          <React.Suspense fallback={null}>
            <DynamicBreadcrumbSegments title={title} />
          </React.Suspense>
        </BreadcrumbList>
      </Breadcrumb>

      {/* `contents` below md lets page items wrap with the sidebar trigger as one header. */}
      <div
        ref={setHeaderSlot}
        data-header-slot
        className="contents md:flex md:min-w-0 md:flex-1 md:items-center md:gap-2"
      />
    </div>
  );
}
