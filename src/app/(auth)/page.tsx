"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const CalendarDashboard = dynamic(
  () => import("@/components/calendar/calendar-dashboard").then((m) => m.CalendarDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100svh-57px)] w-full items-center justify-center text-sm text-neutral-400">
        Loading calendar...
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-[calc(100svh-57px)] w-full items-center justify-center text-sm text-neutral-400">
          Loading calendar...
        </div>
      }
    >
      <CalendarDashboard />
    </React.Suspense>
  );
}
