"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { AuthUIProvider } from "@/components/auth-provider";
import { AuthLayoutShell } from "@/components/auth/auth-layout-shell";
import { SignOut } from "@/components/auth/sign-out";

export default function SignOutPage() {
  return (
    <AuthUIProvider>
      <AuthLayoutShell subtitle="Signing out of your account...">
        <React.Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-orange-500" />
            </div>
          }
        >
          <div className="flex h-40 items-center justify-center">
            <SignOut className="size-6 text-orange-500" />
          </div>
        </React.Suspense>
      </AuthLayoutShell>
    </AuthUIProvider>
  );
}
