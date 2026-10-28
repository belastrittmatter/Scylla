"use client";

import Link from "next/link";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthUIProvider as DaveyplateAuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function AuthUIProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const navigate = ({ to, replace }: { to: string; replace?: boolean }) => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };

  return (
    <AuthProvider
      authClient={authClient}
      Link={Link}
      navigate={navigate}
      redirectTo="/"
      socialProviders={["google"]}
    >
      <DaveyplateAuthUIProvider
        authClient={authClient}
        Link={Link}
        navigate={(href) => router.push(href)}
      >
        {children}
      </DaveyplateAuthUIProvider>
    </AuthProvider>
  );
}
