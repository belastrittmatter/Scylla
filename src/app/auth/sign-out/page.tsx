"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AuthUIProvider } from "@/components/auth-provider";
import { AuthLayoutShell } from "@/components/auth/auth-layout-shell";

function SignOutContent() {
  const router = useRouter();
  const executed = React.useRef(false);

  React.useEffect(() => {
    if (executed.current) return;
    executed.current = true;

    void authClient.signOut().finally(() => {
      router.push("/sign-in");
    });
  }, [router]);

  return (
    <div className="flex h-40 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-orange-500" />
    </div>
  );
}

export default function SignOutPage() {
  return (
    <AuthUIProvider>
      <AuthLayoutShell subtitle="Signing out of your account...">
        <SignOutContent />
      </AuthLayoutShell>
    </AuthUIProvider>
  );
}
