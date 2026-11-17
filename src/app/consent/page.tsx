"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  ConsentHeading,
  ConsentShell,
} from "@/components/consent/consent-shell";
import { ConsentLoading } from "@/components/consent/consent-loading";
import { ConsentSignInRequired } from "@/components/consent/consent-sign-in-required";
import { ConsentScopeList } from "@/components/consent/consent-scope-list";
import { ConsentClientInfo } from "@/components/consent/consent-client-info";
import { ConsentDecisionBar } from "@/components/consent/consent-decision-bar";
import { countDestructiveScopes } from "@/components/consent/consent-scopes";
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

      <ConsentDecisionBar
        email={session.user.email}
        grantedCount={selectedScopes.length}
        destructiveCount={countDestructiveScopes(selectedScopes)}
        isLoading={isLoading}
        error={error}
        onDeny={() => handleConsent(false)}
        onAllow={() => handleConsent(true)}
      />
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
