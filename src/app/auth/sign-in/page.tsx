"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { AuthUIProvider } from "@/components/auth-provider";
import { ProviderButton } from "@/components/auth/provider-button";
import { SignInShowcase } from "@/components/auth/sign-in-showcase";
import { LandingLogo } from "@/components/landing/primitives";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/**
 * A flat hairline note in the landing palette. Only the icon carries color, and only a real
 * failure is red: a cancelled Google prompt (`access_denied`) is not an error worth alarming about.
 */
function SignInError() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  const cancelled = error === "access_denied";

  return (
    <Alert
      className={cn(
        "border-line mt-6 gap-x-2.5 bg-transparent px-3 py-2.5",
        cancelled ? "*:[svg]:text-ink-2" : "*:[svg]:text-destructive",
      )}
    >
      <CircleAlert />
      <AlertDescription className={cancelled ? "text-ink-2" : "text-ink"}>
        {cancelled
          ? "Google sign-in was cancelled. Try again when you're ready."
          : "We couldn't sign you in with Google. Please try again."}
      </AlertDescription>
    </Alert>
  );
}

/** Product promise; the showcase headline on desktop, a quiet line under the form on mobile. */
function ProductPromise({ className }: { className?: string }) {
  return (
    <p className={className}>
      Your team&apos;s calendars, tasks and agents.{" "}
      <span className="text-ink">One schedule.</span>
    </p>
  );
}

/** The landing's blueprint column: 1200px max with dashed rails, shared by every row so edges line up. */
const rails =
  "border-line mx-auto w-full max-w-[1200px] border-x border-dashed";
const gutter = "px-5 sm:px-10";
/** One focus style for the page, matching the showcase controls: a solid ember outline (3:1+ on paper in both themes). */
const focusRing = "focus-visible:outline-ember focus-visible:outline-2";
/** Underlined in ink-3 so the links read as links without color, in both themes. */
const legalLink = cn(
  focusRing,
  "text-ink decoration-ink-3 hover:decoration-ink rounded-sm underline underline-offset-4 outline-offset-2 transition-colors",
);

export default function SignInPage() {
  return (
    <AuthUIProvider>
      <div className="landing bg-paper text-ink selection:bg-ember flex min-h-svh flex-col selection:text-white">
        <header className="border-line border-b">
          <div className={cn(rails, gutter, "flex h-16 items-center")}>
            <Link
              href="/"
              className={cn(focusRing, "w-fit rounded-sm outline-offset-4")}
            >
              <LandingLogo />
            </Link>
          </div>
        </header>

        <div className={cn(rails, "relative flex flex-1")}>
          {/* Column divider, drawn on the frame so it runs the full height while both columns share one top line. */}
          <span
            aria-hidden
            className="border-line pointer-events-none absolute inset-y-0 left-1/2 hidden border-l border-dashed lg:block"
          />
          <div className="grid w-full items-start self-center lg:grid-cols-2">
            <main className={cn(gutter, "py-14 lg:py-20")}>
              <div className="max-w-[400px]">
                <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-0.025em] text-balance lg:text-[44px] lg:leading-[1.05]">
                  Sign in to Scylla
                </h1>
                <p className="text-ink-2 mt-4 text-base leading-relaxed text-pretty">
                  Use the Google account your calendar lives in.
                </p>

                <React.Suspense fallback={null}>
                  <SignInError />
                </React.Suspense>

                <ProviderButton
                  provider="google"
                  variant="default"
                  showLastUsed={false}
                  className={cn(
                    focusRing,
                    "bg-ink text-paper hover:bg-ink/85 mt-8 h-11 w-full gap-2.5 text-sm focus-visible:border-transparent focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:ring-0 [&_svg]:size-[18px]",
                  )}
                />

                <ProductPromise className="border-line text-ink-2 mt-10 border-t border-dashed pt-5 text-sm leading-relaxed text-pretty lg:hidden" />
              </div>
            </main>

            <aside className="hidden px-10 py-20 lg:block">
              <ProductPromise className="text-ink-2 text-2xl leading-snug font-medium tracking-[-0.02em] text-pretty" />
              <p className="text-ink-2 mt-2 text-sm">
                A quick look at what Scylla does once you&apos;re in.
              </p>
              <SignInShowcase className="mt-8" />
            </aside>
          </div>
        </div>

        <footer className="border-line border-t">
          <div className={cn(rails, gutter, "py-6")}>
            <p className="text-ink-2 max-w-[400px] text-xs leading-relaxed">
              By continuing, you agree to our{" "}
              <Link href="/terms" className={legalLink}>
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className={legalLink}>
                Privacy Policy
              </Link>
              . This hosted version is a demo with no guarantees, and its data
              can be reset at any time.
            </p>
          </div>
        </footer>
      </div>
    </AuthUIProvider>
  );
}
