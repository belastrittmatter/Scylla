import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  CONSENT_PRIMARY_HOVER,
  ConsentHeading,
  ConsentShell,
} from "./consent-shell";
import { cn } from "cn";

/** Where sign-in should land afterwards, so the OAuth request survives the round trip. */
function signInHref(returnTo?: string): string {
  return returnTo?.startsWith("/") && !returnTo.startsWith("//")
    ? `/auth/sign-in?redirectTo=${encodeURIComponent(returnTo)}`
    : "/auth/sign-in";
}

export function ConsentSignInRequired({ returnTo }: { returnTo?: string }) {
  return (
    <ConsentShell className="pb-6">
      <ConsentHeading title="Sign In Required">
        <p className="text-ink-2 mt-3 max-w-[52ch] text-sm leading-relaxed">
          Please sign in to your Scylla account before granting scheduling tools
          and workspace access to MCP clients.
        </p>
      </ConsentHeading>
      <div className="mt-6 px-5 sm:px-6">
        <Link
          href={signInHref(returnTo)}
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-10 w-full gap-2 px-4 text-sm sm:w-auto",
            CONSENT_PRIMARY_HOVER,
          )}
        >
          <span>Sign In to Continue</span>
          <ArrowRight />
        </Link>
      </div>
    </ConsentShell>
  );
}
