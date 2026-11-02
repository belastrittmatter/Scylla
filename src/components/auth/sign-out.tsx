"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@better-auth-ui/react";
import { cn } from "cn";
import { Spinner } from "@/components/ui/spinner";
import { signOut as defaultSignOut } from "@/lib/auth-client";

export type SignOutProps = {
  className?: string;
};

export type PerformSignOutOptions = {
  signOutFn?: (options?: {
    fetchOptions?: {
      onSuccess?: () => void;
      onError?: () => void;
    };
  }) => Promise<unknown>;
  onNavigateSignIn: () => void;
  onRefresh?: () => void;
};

export async function performSignOut({
  signOutFn = defaultSignOut,
  onNavigateSignIn,
  onRefresh,
}: PerformSignOutOptions): Promise<void> {
  let completed = false;
  const finalize = () => {
    if (completed) return;
    completed = true;
    onNavigateSignIn();
    onRefresh?.();
  };

  try {
    await signOutFn({
      fetchOptions: {
        onSuccess: finalize,
        onError: finalize,
      },
    });
    finalize();
  } catch {
    finalize();
  }
}

/**
 * Signs the current user out on mount and renders a centered spinner while the operation completes.
 *
 * @param className - Optional additional class names appended to the root element
 * @returns The spinner shown during sign-out
 */
export function SignOut({ className }: SignOutProps) {
  const { authClient, basePaths, navigate, viewPaths } = useAuth();
  const router = useRouter();
  const hasSignedOut = useRef(false);

  useEffect(() => {
    if (hasSignedOut.current) return;
    hasSignedOut.current = true;

    const signInPath = `${basePaths.auth}/${viewPaths.auth.signIn}`;

    void performSignOut({
      signOutFn: (options) => authClient.signOut(options),
      onNavigateSignIn: () =>
        navigate({
          to: signInPath,
          replace: true,
        }),
      onRefresh: () => router.refresh(),
    });
  }, [authClient, basePaths.auth, navigate, router, viewPaths.auth.signIn]);

  return <Spinner className={cn("mx-auto my-auto", className)} />;
}
