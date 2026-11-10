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
      redirectTo="/calendar"
      socialProviders={["google"]}
      emailAndPassword={{ enabled: false }}
    >
      <DaveyplateAuthUIProvider
        authClient={authClient}
        Link={Link}
        navigate={(href) => {
          if (href === "/auth/sign-out" || href.endsWith("/sign-out")) {
            void authClient.signOut().finally(() => {
              router.push("/sign-in");
            });
            return;
          }
          router.push(href);
        }}
        avatar={true}
        deleteUser={true}
        social={{ providers: ["google"] }}
        replace={(href) => router.replace(href)}
        redirectTo="/calendar"
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
