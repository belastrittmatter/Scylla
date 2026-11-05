"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createAuthClient } from "better-auth/react";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { ALL_MCP_CAPABILITIES } from "@/constants/agent-capabilities";

// Dedicated client for OAuth consent with disabled redirectPlugin so scope persistence finishes first
const consentClient = createAuthClient({
  disableDefaultFetchPlugins: true,
  plugins: [oauthProviderClient()],
});

export function useConsentForm(clientId: string, requestedScopeParam: string) {
  const router = useRouter();

  // Initialize selected scopes: if specific MCP scopes requested, use those;
  // otherwise default to standard non-destructive capabilities.
  const [selectedScopes, setSelectedScopes] = React.useState<string[]>(() => {
    if (requestedScopeParam) {
      const requested = requestedScopeParam
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const validRequested = requested.filter((s) =>
        ALL_MCP_CAPABILITIES.some((c) => c.id === s),
      );
      if (validRequested.length > 0) {
        return validRequested;
      }
    }
    return ALL_MCP_CAPABILITIES.filter((c) => !c.isDestructive).map(
      (c) => c.id,
    );
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleToggleScope = (scopeId: string, checked: boolean) => {
    setSelectedScopes((prev) =>
      checked
        ? Array.from(new Set([...prev, scopeId]))
        : prev.filter((id) => id !== scopeId),
    );
  };

  const handleSelectAll = () => {
    setSelectedScopes(ALL_MCP_CAPABILITIES.map((c) => c.id));
  };

  const handleSelectStandard = () => {
    setSelectedScopes(
      ALL_MCP_CAPABILITIES.filter((c) => !c.isDestructive).map((c) => c.id),
    );
  };

  const handleClearAll = () => {
    setSelectedScopes([]);
  };

  const handleConsent = async (accept: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!accept) {
        const { data, error: consentError } =
          await consentClient.oauth2.consent({
            accept: false,
          });

        if (consentError) {
          throw new Error(
            consentError.message ||
              consentError.statusText ||
              "Failed to submit consent denial",
          );
        }

        const redirectTarget =
          data && "url" in data && typeof data.url === "string"
            ? data.url
            : undefined;

        if (redirectTarget) {
          window.location.href = redirectTarget;
        } else {
          router.push("/calendar");
        }
        return;
      }

      // Filter originally requested scopes to authorized subset
      const requestedScopesList = requestedScopeParam
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const betterAuthScope =
        requestedScopesList.length > 0
          ? requestedScopesList
              .filter(
                (s) =>
                  !ALL_MCP_CAPABILITIES.some((cap) => cap.id === s) ||
                  selectedScopes.includes(s),
              )
              .join(" ")
          : undefined;

      const { data, error: consentError } = await consentClient.oauth2.consent({
        accept: true,
        scope: betterAuthScope || undefined,
      });

      if (consentError) {
        throw new Error(
          consentError.message ||
            consentError.statusText ||
            "Failed to submit consent",
        );
      }

      // Persist the user's customized MCP capabilities to the consent record
      if (clientId && clientId !== "Unknown Client") {
        let persisted = false;
        let lastErrorText = "";
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch("/api/agents/scopes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              keepalive: true,
              body: JSON.stringify({
                clientId,
                scopes: selectedScopes,
              }),
            });
            if (res.ok) {
              persisted = true;
              break;
            }
            lastErrorText = await res.text().catch(() => "");
          } catch (scopeErr) {
            lastErrorText =
              scopeErr instanceof Error ? scopeErr.message : String(scopeErr);
          }
          await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
        }

        if (!persisted) {
          throw new Error(
            `Failed to save permission selections: ${lastErrorText || "Server error"}`,
          );
        }
      }

      const redirectTarget =
        data && "url" in data && typeof data.url === "string"
          ? data.url
          : undefined;

      if (redirectTarget) {
        window.location.href = redirectTarget;
      } else {
        router.push("/calendar");
      }
    } catch (err: unknown) {
      console.error("Error submitting OAuth consent:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setIsLoading(false);
    }
  };

  return {
    selectedScopes,
    isLoading,
    error,
    handleToggleScope,
    handleSelectAll,
    handleSelectStandard,
    handleClearAll,
    handleConsent,
  };
}
