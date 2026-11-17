import { Skeleton } from "@/components/ui/skeleton";

const PAGE = "mx-auto w-full max-w-4xl p-4 sm:p-6 md:p-8";

function ListRows({ rows }: { rows: number }) {
  return (
    <div className="divide-border divide-y rounded-lg border">
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
          <Skeleton className="h-4 w-full max-w-72" />
        </div>
        <div className="flex h-9 items-center gap-5 border-b">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="space-y-3">
          <div className="flex min-h-7 items-center justify-between gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
          <ListRows rows={4} />
        </div>
      </div>
    );
  }
  return (
    <div className={`${PAGE} space-y-6`} aria-busy="true">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-7 w-full max-w-28" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
        <Skeleton className="h-8 w-24 shrink-0" />
      </div>
      <ListRows rows={3} />
    </div>
  );
}
