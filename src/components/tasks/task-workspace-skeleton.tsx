import * as React from "react";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

export function TaskWorkspaceSkeleton() {
  return (
    <div className="flex h-[calc(100svh-57px)] w-full flex-col bg-neutral-50/50 dark:bg-neutral-950">
      <div className="flex h-14 items-center justify-between border-b border-neutral-200/80 px-6 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-8 w-44" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="flex h-12 items-center justify-between border-b border-neutral-200/60 px-6 dark:border-neutral-800">
        <Skeleton className="h-8 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center gap-2 text-sm text-neutral-500">
        <Spinner className="size-5 text-neutral-400" />
        <span>Loading workspace...</span>
      </div>
    </div>
  );
}
