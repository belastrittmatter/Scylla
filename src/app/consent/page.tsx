"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, ShieldCheck } from "lucide-react";
import {
  CONSENT_PRIMARY_HOVER,
  ConsentHeading,
  ConsentShell,
} from "@/components/consent/consent-shell";
import { ConsentLoading } from "@/components/consent/consent-loading";
import { ConsentSignInRequired } from "@/components/consent/consent-sign-in-required";
import { ConsentScopeList } from "@/components/consent/consent-scope-list";
import { ConsentClientInfo } from "@/components/consent/consent-client-info";
import { useConsentForm } from "@/components/consent/use-consent-form";

function ConsentContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
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
    return <ConsentLoading label="Loading session..." />;
  }

  if (!session?.user) {
    const query = searchParams.toString();
    return (
      <ConsentSignInRequired
        returnTo={`${pathname}${query ? `?${query}` : ""}`}
      />
    );
  }

  const enabledCount = selectedScopes.length;

  return (
    <ConsentShell>
      <ConsentHeading title="Authorize MCP Client">
        <ConsentClientInfo client={client} />
      </ConsentHeading>

      <ConsentScopeList
        selectedScopes={selectedScopes}
        onToggleScope={handleToggleScope}
        onSelectAll={handleSelectAll}
        onSelectStandard={handleSelectStandard}
        onClearAll={handleClearAll}
      />

      {/* Sticky decision bar: who is authorizing, Deny and Allow stay on screen while scopes are toggled. */}
      <div className="border-line bg-surface sticky bottom-0 z-10 space-y-3 rounded-b-xl border-t px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
        {error && (
          <p
            role="alert"
            className="text-destructive flex items-start gap-2 text-sm"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>{error}</span>
          </p>
        )}

        <p className="text-ink-2 text-sm">
          Authorizing as{" "}
          <span className="text-ink font-medium [overflow-wrap:anywhere]">
            {session.user.email}
          </span>
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => handleConsent(false)}
            className="h-10 text-sm"
          >
            Deny Access
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={() => handleConsent(true)}
            className={`h-10 gap-2 text-sm ${CONSENT_PRIMARY_HOVER}`}
          >
            {isLoading ? (
              <>
                <Spinner aria-hidden="true" role="presentation" />
                <span>Authorizing...</span>
              </>
            ) : (
              <>
                <ShieldCheck aria-hidden="true" />
                <span>
                  Allow Access{" "}
                  <span className="tabular-nums">({enabledCount})</span>
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </ConsentShell>
  );
}

export default function ConsentPage() {
  return (
    <React.Suspense
      fallback={<ConsentLoading label="Loading authorization..." />}
    >
      <ConsentContent />
    </React.Suspense>
  );
}
