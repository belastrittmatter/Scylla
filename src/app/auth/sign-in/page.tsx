"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, CircleAlert, DoorOpen, UserRound } from "lucide-react";
import { AuthUIProvider } from "@/components/auth-provider";
import { ProviderButton } from "@/components/auth/provider-button";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mirrors the Google scopes requested in src/lib/auth.ts, so the consent screen holds no surprises.
const ACCESS = [
  { icon: CalendarDays, label: "See and edit events on your calendars" },
  { icon: DoorOpen, label: "See your organization's meeting rooms" },
  { icon: UserRound, label: "Know your name, email and profile photo" },
];

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
                Scylla works on top of your Google Calendar. Use your work
                account. If you&apos;re new, we&apos;ll set up your workspace
                automatically.
              </p>

              <React.Suspense fallback={null}>
                <SignInError />
              </React.Suspense>

              <ProviderButton
                provider="google"
                showLastUsed={false}
                className="mt-8 h-11 w-full text-[15px] shadow-xs [&_svg]:size-5"
              />

              <div className="mt-10 border-t pt-6">
                <p className="text-foreground text-sm font-medium">
                  Google will ask to let Scylla
                </p>
                <ul className="text-muted-foreground mt-3 space-y-2.5 text-sm">
                  {ACCESS.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3">
                      <Icon
                        aria-hidden
                        className="size-4 shrink-0 text-orange-600 dark:text-orange-400"
                      />
                      {label}
                    </li>
                  ))}
                </ul>
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
          className="bg-muted relative hidden overflow-hidden border-l lg:block"
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-orange-500/10 to-transparent" />
          <div className="absolute inset-0 px-12 pt-16 xl:px-16 xl:pt-20">
            <p className="max-w-md text-2xl font-semibold leading-snug tracking-tight">
              Your team&apos;s calendars, rooms and AI agents, scheduled in one
              place.
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
