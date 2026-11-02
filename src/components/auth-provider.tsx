"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthUIProvider as DaveyplateAuthUIProvider } from "@daveyplate/better-auth-ui";
import { AuthProvider } from "@/components/auth/auth-provider";
import { authClient } from "@/lib/auth-client";

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
        replace={(href) => router.replace(href)}
        onSessionChange={() => router.refresh()}
        account={{
          basePath: "",
          viewPaths: {
            SETTINGS: "settings",
          },
        }}
      >
        {children}
      </DaveyplateAuthUIProvider>
    </AuthProvider>
  );
}
