"use client";

import * as React from "react";
import { SignUp } from "@/components/auth/sign-up";
import { AuthUIProvider } from "@/components/auth-provider";
import { AuthLayoutShell } from "@/components/auth/auth-layout-shell";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  return (
    <AuthUIProvider>
      <AuthLayoutShell subtitle="Create your Scylla account to get started">
        <React.Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-orange-500" />
            </div>
          }
        >
          <SignUp />
        </React.Suspense>
      </AuthLayoutShell>
    </AuthUIProvider>
  );
}
