import { Skeleton } from "@/components/ui/skeleton";

const PAGE = "w-full max-w-4xl p-4 sm:p-6 md:p-8";

/** Placeholder for a bordered resource list: a column-head bar, then hairline rows. */
export function ListRows({ rows }: { rows: number }) {
  return (
    <div
      className="overflow-hidden rounded-lg border"
      aria-busy="true"
      role="status"
      aria-label="Loading"
    >
      <div className="bg-muted/30 flex h-9 items-center border-b px-4">
        <Skeleton className="h-3 w-14" />
      </div>
      <div className="divide-border divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-full max-w-48" />
              <Skeleton className="h-3 w-full max-w-32" />
            </div>
            <Skeleton className="h-5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Placeholder for the members table: avatar, name and email, role badge. */
export function MemberTableSkeleton({ rows }: { rows: number }) {
  return (
    <div
      className="overflow-hidden rounded-lg border"
      aria-busy="true"
      role="status"
      aria-label="Loading members"
    >
      <div className="bg-muted/30 flex h-9 items-center border-b px-4">
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="divide-border divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2 pl-4 pr-3">
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-full max-w-40" />
            </div>
            <Skeleton className="hidden h-3 w-full max-w-48 sm:block" />
            <Skeleton className="h-5 w-14 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mirrors the loaded layout (header, tabs, toolbar, list) so nothing shifts. */
export function TeamsPageSkeleton({
  variant = "list",
}: {
  variant?: "list" | "detail";
}) {
  if (variant === "detail") {
    return (
      <div className={`${PAGE} space-y-5`} aria-busy="true">
        <div className="space-y-1">
          <Skeleton className="h-7 w-full max-w-56" />
          <Skeleton className="h-4 w-full max-w-32" />
        </div>
        <div className="flex h-9 items-center gap-6 border-b border-dashed">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          <div className="flex min-h-7 items-center justify-end gap-3">
            <Skeleton className="h-7 w-28" />
          </div>
          <ListRows rows={4} />
        </div>
      </div>
    );
  }
  return (
    <div className={`${PAGE} space-y-6`} aria-busy="true">
      <div className="flex items-start justify-between gap-4 border-b border-dashed pb-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-7 w-full max-w-28" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
        <Skeleton className="h-7 w-24 shrink-0" />
      </div>
      <ListRows rows={3} />
    </div>
  );
}
