import { Skeleton } from "@/components/ui/skeleton";

export function TeamsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-8">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
