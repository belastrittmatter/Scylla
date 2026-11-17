import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { WORKSPACE_GUTTER } from "./task-layout";

/** List rows while the workspace loads; the header bar lives in ViewHeader. */
export function TaskWorkspaceSkeleton() {
  return (
    <div className={cn("space-y-2 py-4", WORKSPACE_GUTTER)}>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}
