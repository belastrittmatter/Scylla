import { cn } from "cn";
import { Eyebrow } from "@/components/landing/primitives";
import { ConsentBrandHeader } from "./consent-brand-header";

/**
 * App tokens remapped onto the landing palette for this page only, so the
 * shared Button and Switch read as ember plus warm hairlines. Light uses
 * ember-deep (white text, AA); dark uses ember with dark text. `--caution` and
 * `--caution-soft` are consent-only, for the Unverified client note (kept
 * gold, apart from ember).
 */
const CONSENT_TOKENS = [
  "[--primary:var(--ember-deep)] dark:[--primary:var(--ember)]",
  "[--primary-foreground:var(--surface)]",
  "[--ring:var(--ember)]",
  "[--border:var(--line)] [--input:var(--line)]",
  "[--background:var(--surface)] [--foreground:var(--ink)]",
  "[--muted:color-mix(in_oklab,var(--ink)_6%,var(--surface))] [--muted-foreground:var(--ink-2)]",
  "[--caution:oklch(0.476_0.114_61.9)] dark:[--caution:oklch(0.879_0.169_91.6)]",
  "[--caution-soft:oklch(0.987_0.022_95.3)] dark:[--caution-soft:oklch(0.879_0.169_91.6/0.06)]",
].join(" ");

/** Primary action hover: one shade deeper in light, one lighter in dark. */
export const CONSENT_PRIMARY_HOVER =
  "hover:bg-[color-mix(in_oklab,var(--primary),var(--ink)_14%)]";

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
    <main
      className={cn(
        "landing selection:bg-ember flex min-h-dvh flex-1 flex-col selection:text-white",
        CONSENT_TOKENS,
      )}
    >
      <div className="border-line mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-8 px-4 py-8 sm:border-x sm:border-dashed sm:px-12 sm:py-16">
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
