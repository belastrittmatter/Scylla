"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { ViewHeader } from "./view-header";
import { BreadcrumbProvider } from "./breadcrumb-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <BreadcrumbProvider>
      <SidebarProvider
        className="relative h-svh w-full overflow-hidden bg-neutral-100/60 dark:bg-neutral-950"
        defaultOpen
      >
        <React.Suspense fallback={null}>
          <AppSidebar className="z-10 bg-transparent" />
        </React.Suspense>

        <SidebarInset className="relative z-10 flex h-[calc(100svh)] flex-1 flex-col overflow-hidden border border-black/[0.08] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:border-white/[0.08] dark:bg-neutral-900">
          {/* Fixed Header */}
          <div className="shrink-0">
            <React.Suspense fallback={null}>
              <ViewHeader />
            </React.Suspense>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  );
}
