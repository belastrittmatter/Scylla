"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { AuthUIProvider } from "@/components/auth-provider";
import { ProviderButton } from "@/components/auth/provider-button";
import { SignInShowcase } from "@/components/auth/sign-in-showcase";
import { Eyebrow, LandingLogo } from "@/components/landing/primitives";
import { Alert, AlertDescription } from "@/components/ui/alert";

function SignInError() {
  const error = useSearchParams().get("error");
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mt-6">
      <CircleAlert />
      <AlertDescription>
        {error === "access_denied"
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

const legalLink =
  "text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink";

export default function SignInPage() {
  return (
    <AuthUIProvider>
      <div className="landing bg-paper text-ink selection:bg-ember grid min-h-svh selection:text-white lg:grid-cols-2">
        <div className="flex flex-col px-6 py-6 md:px-10 md:py-10">
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
            <Link
              href="/"
              className="focus-visible:ring-ember/40 w-fit rounded-md outline-none focus-visible:ring-3"
            >
              <LandingLogo />
            </Link>

            <main className="flex flex-1 flex-col pt-16 pb-12 lg:justify-center lg:pt-12">
              <Eyebrow className="text-ink-2">Team scheduling</Eyebrow>
              <h1 className="mt-5 text-[32px] leading-[1.1] font-medium tracking-[-0.025em] text-balance">
                Sign in to Scylla
              </h1>
              <p className="text-ink-2 mt-3 text-[15px] leading-relaxed">
                Use the Google account your calendar lives in.
              </p>

              <React.Suspense fallback={null}>
                <SignInError />
              </React.Suspense>

              <ProviderButton
                provider="google"
                variant="default"
                showLastUsed={false}
                className="bg-ink text-paper hover:bg-ink/85 focus-visible:ring-ember/40 mt-8 h-11 w-full gap-2.5 text-sm [&_svg]:size-[18px]"
              />

              <ProductPromise className="border-line text-ink-2 mt-10 border-t border-dashed pt-5 text-sm leading-relaxed text-pretty lg:hidden" />
            </main>

            <p className="text-ink-2 text-xs leading-relaxed">
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
        </div>

        <aside className="border-line hidden border-l border-dashed lg:block">
          <div className="mx-auto flex h-full max-w-md flex-col justify-center py-16">
            <ProductPromise className="text-ink-2 text-xl leading-snug font-medium tracking-[-0.02em] text-pretty" />
            <p className="text-ink-2 mt-2 text-sm">
              A quick look at what Scylla does once you&apos;re in.
            </p>
            <SignInShowcase className="mt-8" />
          </div>
        </aside>
      </div>
    </AuthUIProvider>
  );
}
