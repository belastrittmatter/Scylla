import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ConsentHeading, ConsentShell } from "./consent-shell";
import { cn } from "cn";

export function ConsentSignInRequired() {
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
          href="/sign-in"
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-10 w-full gap-2 px-4 text-sm sm:w-auto",
          )}
        >
          <span>Sign In to Continue</span>
          <ArrowRight />
        </Link>
      </div>
    </ConsentShell>
  );
}
