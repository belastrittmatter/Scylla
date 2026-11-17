import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** One container for the page and its loading state, so nothing jumps when it loads. */
export const projectSettingsPageClass =
  "mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8";

/** Three rows shaped like the member rows (name over email). */
export function MemberSkeletonRows() {
  return (
    <ul aria-hidden className="divide-y">
      {[0, 1, 2].map((i) => (
        <li key={i} className="space-y-1.5 py-2.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-44" />
        </li>
      ))}
    </ul>
  );
}

/** The page's Suspense fallback: header, the repository card and the members card. */
export function ProjectSettingsSkeleton() {
  return (
    <div role="status" className={projectSettingsPageClass}>
      <span className="sr-only">Loading project settings…</span>
      <div aria-hidden className="space-y-6">
        <div className="space-y-2 py-0.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-7 w-56" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="grid-cols-[1fr_auto] items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-7 w-28" />
          </CardHeader>
          <CardContent>
            <MemberSkeletonRows />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
