"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { AuthUIProvider } from "@/components/auth-provider";
import { ProviderButton } from "@/components/auth/provider-button";
import { SignInShowcase } from "@/components/auth/sign-in-showcase";
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
          {/* Light: soft orange wash. Dark: a neutral white lift; orange over near-black reads brown. */}
          <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,rgb(249_115_22/0.12),transparent_70%)] dark:bg-[radial-gradient(90%_60%_at_50%_0%,rgb(255_255_255/0.13),transparent_75%)]" />
          <div className="relative mx-auto flex h-full max-w-md flex-col justify-center py-16">
            <p className="text-2xl leading-snug font-semibold tracking-tight">
              Your team&apos;s calendars, tasks and agents.{" "}
              <span className="text-orange-600 dark:text-orange-400">
                One schedule.
              </span>
            </p>
            <p className="text-muted-foreground mt-3 text-sm">
              A quick look at what Scylla does once you&apos;re in.
            </p>
            <SignInShowcase className="mt-10" />
          </div>
        </aside>
      </div>
    </AuthUIProvider>
  );
}
