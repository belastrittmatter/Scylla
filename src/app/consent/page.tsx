"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Loader2 } from "lucide-react";
import { ConsentBrandHeader } from "@/components/consent/consent-brand-header";
import { ConsentSignInRequired } from "@/components/consent/consent-sign-in-required";
import { ConsentScopeList } from "@/components/consent/consent-scope-list";
import { ConsentClientInfo } from "@/components/consent/consent-client-info";
import { useConsentForm } from "@/components/consent/use-consent-form";

function ConsentContent() {
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionPending } = useSession();

  const clientId = searchParams.get("client_id") || "";
  const requestedScopeParam = searchParams.get("scope") || "";

  const {
    client,
    selectedScopes,
    isLoading,
    error,
    handleToggleScope,
    handleSelectAll,
    handleSelectStandard,
    handleClearAll,
    handleConsent,
  } = useConsentForm(clientId, requestedScopeParam);

  if (isSessionPending) {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-orange-500" />
          <p className="text-muted-foreground text-xs font-medium">
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return <ConsentSignInRequired />;
  }

  const enabledCount = selectedScopes.length;

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center p-4 selection:bg-orange-500/20 selection:text-orange-600">
      <ConsentBrandHeader badgeLabel="MCP Native" />

      <Card className="border-border bg-card w-full max-w-xl overflow-hidden rounded-2xl p-0 shadow-xl">
        <CardHeader className="border-border bg-muted/20 border-b px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="shadow-2xs flex size-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 ring-4 ring-orange-500/5 dark:text-orange-400">
                <ShieldCheck className="size-5.5" />
              </div>
              <div className="text-left">
                <CardTitle className="text-foreground text-base font-bold tracking-tight">
                  Authorize MCP Client
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-0.5 text-xs">
                  Model Context Protocol (MCP) OAuth 2.1 Consent
                </CardDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="shrink-0 gap-1 border-orange-500/30 bg-orange-500/10 text-[11px] font-medium text-orange-600 dark:text-orange-400"
            >
              OAuth 2.1
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-6 py-5 text-xs">
          <ConsentClientInfo client={client} />

          <ConsentScopeList
            selectedScopes={selectedScopes}
            onToggleScope={handleToggleScope}
            onSelectAll={handleSelectAll}
            onSelectStandard={handleSelectStandard}
            onClearAll={handleClearAll}
          />

          {error && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-3 text-xs">
              {error}
            </div>
          )}

          <div className="bg-muted/40 text-muted-foreground border-border/60 rounded-xl border px-3.5 py-2.5 text-center text-xs">
            Authorizing as{" "}
            <span className="text-foreground font-semibold">
              {session.user.email}
            </span>
          </div>
        </CardContent>

        <CardFooter className="border-border bg-muted/10 flex flex-col gap-2.5 border-t px-6 py-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => handleConsent(false)}
            className="border-border text-foreground hover:bg-muted h-10 w-full cursor-pointer rounded-xl text-xs font-medium sm:w-1/2"
          >
            Deny Access
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={() => handleConsent(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs h-10 w-full cursor-pointer gap-2 rounded-xl text-xs font-semibold disabled:opacity-60 sm:w-1/2"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin text-orange-400" />
                <span>Authorizing...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-4 text-orange-400 dark:text-orange-500" />
                <span>Allow Access ({enabledCount})</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <React.Suspense
      fallback={
        <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-orange-500" />
            <p className="text-muted-foreground text-xs font-medium">
              Loading authorization...
            </p>
          </div>
        </div>
      }
    >
      <ConsentContent />
    </React.Suspense>
  );
}
