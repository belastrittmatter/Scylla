import { Skeleton } from "@/components/ui/skeleton";

/** The page frame, shared with ProjectSettingsView so loading doesn't shift. */
export const PROJECT_SETTINGS_FRAME =
  "mx-auto w-full max-w-4xl space-y-8 p-6 md:p-8";

export function ProjectSettingsSkeleton() {
  return (
    <div className={PROJECT_SETTINGS_FRAME}>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 max-w-full" />
        <Skeleton className="h-4 w-24 max-w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-40 max-w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 max-w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
