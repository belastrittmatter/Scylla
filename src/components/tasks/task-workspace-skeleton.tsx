import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** List rows while the workspace loads; the header bar lives in ViewHeader. */
export function TaskWorkspaceSkeleton() {
  return (
    <div className="space-y-2 p-4 sm:px-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}
