import { Spinner } from "@/components/ui/spinner";

/** Full-screen wait state for the consent page (session or route loading). */
export function ConsentLoading({ label }: { label: string }) {
  return (
    <main className="landing flex min-h-dvh flex-1 items-center justify-center px-4">
      <div role="status" className="text-ink-2 flex items-center gap-2 text-sm">
        <Spinner aria-hidden="true" role="presentation" />
        <span>{label}</span>
      </div>
    </main>
  );
}
