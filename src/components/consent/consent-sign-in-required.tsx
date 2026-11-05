"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import { ConsentBrandHeader } from "./consent-brand-header";
import { cn } from "cn";

export function ConsentSignInRequired() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4">
      <ConsentBrandHeader badgeLabel="MCP Server" />

      <Card className="border-border bg-card w-full max-w-md rounded-2xl p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 ring-4 ring-orange-500/5 dark:text-orange-400">
          <Lock className="size-6" />
        </div>
        <h2 className="text-foreground text-base font-bold">
          Sign In Required
        </h2>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          Please sign in to your Scylla account before granting scheduling tools
          and workspace access to MCP clients.
        </p>
        <Link
          href="/sign-in"
          className={cn(
            buttonVariants({ variant: "default" }),
            "shadow-2xs mt-6 h-10 w-full cursor-pointer gap-2 rounded-xl font-semibold",
          )}
        >
          <span>Sign In to Continue</span>
          <ArrowRight className="size-4" />
        </Link>
      </Card>
    </div>
  );
}
