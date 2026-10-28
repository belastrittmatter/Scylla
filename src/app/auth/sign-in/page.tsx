"use client";

import * as React from "react";
import { SignIn } from "@/components/auth/sign-in";
import { AuthUIProvider } from "@/components/auth-provider";
import { AuthLayoutShell } from "@/components/auth/auth-layout-shell";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  return (
    <AuthUIProvider>
      <AuthLayoutShell subtitle="Sign in to orchestrate meetings and agent schedules">
        <React.Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-orange-500" />
            </div>
          }
        >
          <SignIn />
        </React.Suspense>
      </AuthLayoutShell>
    </AuthUIProvider>
  );
}
