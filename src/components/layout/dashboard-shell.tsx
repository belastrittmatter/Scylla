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
        className="relative h-svh w-full overflow-hidden bg-sidebar"
        defaultOpen
      >
        <React.Suspense fallback={null}>
          <AppSidebar />
        </React.Suspense>

        <SidebarInset className="relative flex h-[calc(100svh)] flex-1 flex-col overflow-hidden bg-muted/40">
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
