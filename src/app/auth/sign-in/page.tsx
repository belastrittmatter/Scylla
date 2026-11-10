"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { AuthUIProvider } from "@/components/auth-provider";
import { ProviderButton } from "@/components/auth/provider-button";
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

export default function SignInPage() {
  return (
    <AuthUIProvider>
      <div className="bg-background text-foreground grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col p-6 md:p-10">
          <Link
            href="/"
            className="flex w-fit items-center gap-2.5 rounded-md text-base font-semibold tracking-tight"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={28}
              height={28}
              priority
              className="size-7 dark:invert"
            />
            Scylla
          </Link>

          <main className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-sm">
              <h1 className="text-2xl font-semibold tracking-tight">
                Sign in to Scylla
              </h1>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Use the Google account your calendar lives in.
              </p>

              <React.Suspense fallback={null}>
                <SignInError />
              </React.Suspense>

              <ProviderButton
                provider="google"
                showLastUsed={false}
                className="mt-8 h-11 w-full text-[15px] shadow-xs [&_svg]:size-5"
              />

              {/* Illustrative: the one thing Scylla adds on top of Google Calendar. */}
              <div
                aria-hidden
                className="bg-card mt-10 rounded-xl border p-4 text-sm shadow-xs"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">Design review</span>
                  <span className="text-muted-foreground tabular-nums">
                    Thu 14:00
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">
                  Focus Room Alpha · 4 people
                </p>
                <div className="text-muted-foreground mt-3 flex items-center gap-2 border-t border-dashed pt-3">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Booked by Claude
                  <span className="ml-auto rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                    via MCP
                  </span>
                </div>
              </div>
            </div>
          </main>

          <p className="text-muted-foreground text-center text-xs">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="hover:text-foreground underline underline-offset-4"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="hover:text-foreground underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <aside
          aria-hidden
          className="bg-muted relative hidden overflow-hidden border-l lg:block dark:bg-neutral-900"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 dark:opacity-40" />
          <div className="absolute inset-0 px-12 pt-16 xl:px-16 xl:pt-20">
            <p className="max-w-md text-2xl font-semibold leading-snug tracking-tight">
              Your team&apos;s calendars, rooms and agents.{" "}
              <span className="text-orange-600 dark:text-orange-400">
                One schedule.
              </span>
            </p>
            <p className="text-muted-foreground mt-3 max-w-md text-sm">
              Find a time that works for everyone, book the room, and let agents
              handle the back-and-forth over MCP.
            </p>
            {/* Bleeds off the right and bottom edges so it reads as a peek into the app. */}
            <Image
              src="/images/calendar-dashboard-preview.png"
              alt=""
              width={1591}
              height={991}
              priority
              className="ring-foreground/10 mt-12 w-[200%] max-w-none rounded-xl shadow-2xl ring-1 dark:brightness-90"
            />
          </div>
        </aside>
      </div>
    </AuthUIProvider>
  );
}
