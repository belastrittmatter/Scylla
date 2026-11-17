import { cn } from "cn";
import { Eyebrow } from "@/components/landing/primitives";
import { ConsentBrandHeader } from "./consent-brand-header";

/**
 * Consent page frame: the landing palette scoped to this page, a column with
 * the blueprint rails, the wordmark, then one hairline panel.
 */
export function ConsentShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className="landing selection:bg-ember flex min-h-dvh flex-1 flex-col selection:text-white">
      <div className="border-line mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-8 border-x border-dashed px-4 py-8 sm:px-12 sm:py-16">
        <ConsentBrandHeader />
        <div
          className={cn(
            "border-line bg-surface rounded-xl border text-sm",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </main>
  );
}

/** Mono eyebrow and page heading at the top of the consent panel. */
export function ConsentHeading({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-5 pt-6 sm:px-6">
      <Eyebrow className="text-ink-2">OAuth 2.1 · MCP consent</Eyebrow>
      <h1 className="text-ink mt-3 text-2xl font-medium tracking-[-0.02em] text-balance">
        {title}
      </h1>
      {children}
    </div>
  );
}
