"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
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
import { Switch } from "@/components/ui/switch";
import {
  ShieldCheck,
  ShieldAlert,
  CalendarDays,
  Lock,
  Bot,
  ArrowRight,
  Loader2,
  Building2,
  ListTodo,
  FolderKanban,
  Users,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import {
  ALL_MCP_CAPABILITIES,
  type McpCapabilityDefinition,
} from "@/constants/agent-capabilities";
import { cn } from "cn";

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  calendar: { label: "Calendar", icon: CalendarDays },
  rooms: { label: "Rooms & Workspaces", icon: Building2 },
  tasks: { label: "Tasks & Work", icon: ListTodo },
  projects: { label: "Projects", icon: FolderKanban },
  teams: { label: "Teams & Access", icon: Users },
};

function ConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();

  const clientId = searchParams.get("client_id") || "Unknown Client";
  const requestedScopeParam = searchParams.get("scope") || "";

  // Initialize selected scopes from requested query params or defaults
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
    return [];
  });

  const [isCustomizeExpanded, setIsCustomizeExpanded] = React.useState(true);
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

  const handleClearAll = () => {
    setSelectedScopes([]);
  };

  const handleConsent = async (accept: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!accept) {
        const { data, error: consentError } = await authClient.oauth2.consent({
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
          router.push("/");
        }
        return;
      }

      // When accepting consent:
      // Better Auth strictly validates that every scope in `ctx.body.scope` was in `originalRequestedScopes`.
      // It throws BAD_REQUEST if any scope in `scope` was not originally requested.
      const requestedScopesList = requestedScopeParam
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      // Only pass a subset of originally requested scopes to Better Auth
      const betterAuthScope =
        requestedScopesList.length > 0
          ? requestedScopesList
              .filter(
                (s) =>
                  // Keep standard OIDC scopes (openid, profile, email, offline_access, etc.)
                  !ALL_MCP_CAPABILITIES.some((cap) => cap.id === s) ||
                  // Or if it is an MCP scope, keep only if user selected it
                  selectedScopes.includes(s),
              )
              .join(" ")
          : undefined;

      const { data, error: consentError } = await authClient.oauth2.consent({
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
            console.warn(
              `Attempt ${attempt + 1} to persist scopes failed (${res.status}):`,
              lastErrorText,
            );
          } catch (scopeErr) {
            lastErrorText =
              scopeErr instanceof Error ? scopeErr.message : String(scopeErr);
            console.warn(
              `Attempt ${attempt + 1} to persist scopes failed:`,
              scopeErr,
            );
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
        router.push("/");
      }
    } catch (err: unknown) {
      console.error("Error submitting OAuth consent:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setIsLoading(false);
    }
  };

  // Group capabilities by category
  const capabilitiesByCategory = React.useMemo(() => {
    const groups: Record<string, McpCapabilityDefinition[]> = {};
    for (const cap of ALL_MCP_CAPABILITIES) {
      const cat = cap.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(cap);
    }
    return groups;
  }, []);

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
    return (
      <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4">
        {/* Brand Header */}
        <Link href="/" className="group mb-6 flex items-center gap-3">
          <div className="shadow-2xs flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-white p-1 transition-transform duration-200 group-hover:scale-105 dark:border-neutral-800 dark:bg-neutral-900">
            <Image
              src="/logo.svg"
              alt="Scylla"
              width={32}
              height={32}
              className="size-7 object-contain dark:invert"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground text-lg font-bold tracking-tight">
              Scylla
            </span>
            <Badge
              variant="outline"
              className="gap-1 border-orange-500/20 bg-orange-500/10 text-[10px] font-medium text-orange-600 dark:text-orange-400"
            >
              <Bot className="size-2.5" />
              MCP Server
            </Badge>
          </div>
        </Link>

        <Card className="border-border bg-card w-full max-w-md rounded-2xl p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 ring-4 ring-orange-500/5 dark:text-orange-400">
            <Lock className="size-6" />
          </div>
          <h2 className="text-foreground text-base font-bold">
            Sign In Required
          </h2>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            Please sign in to your Scylla account before granting scheduling
            tools and workspace access to MCP clients.
          </p>
          <Button
            onClick={() =>
              router.push(
                `/sign-in${typeof window !== "undefined" ? window.location.search : ""}`,
              )
            }
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs mt-6 h-10 w-full cursor-pointer gap-2 rounded-xl font-semibold"
          >
            <span>Sign In to Continue</span>
            <ArrowRight className="size-4" />
          </Button>
        </Card>
      </div>
    );
  }

  const enabledCount = selectedScopes.length;
  const hasDestructiveSelected = ALL_MCP_CAPABILITIES.some(
    (c) => c.isDestructive && selectedScopes.includes(c.id),
  );

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center p-4 selection:bg-orange-500/20 selection:text-orange-600">
      {/* Brand Header */}
      <Link href="/" className="group mb-6 flex items-center gap-3">
        <div className="shadow-2xs flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-white p-1 transition-transform duration-200 group-hover:scale-105 dark:border-neutral-800 dark:bg-neutral-900">
          <Image
            src="/logo.svg"
            alt="Scylla"
            width={32}
            height={32}
            className="size-7 object-contain dark:invert"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground text-lg font-bold tracking-tight">
            Scylla
          </span>
          <Badge
            variant="outline"
            className="gap-1 border-orange-500/20 bg-orange-500/10 text-[10px] font-medium text-orange-600 dark:text-orange-400"
          >
            <Bot className="size-2.5" />
            MCP Native
          </Badge>
        </div>
      </Link>

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
          {/* Client Notice */}
          <div className="border-border bg-muted/30 rounded-xl border p-3.5 text-xs leading-relaxed">
            <p className="text-foreground">
              The external AI client{" "}
              <Badge
                variant="secondary"
                className="bg-background border-border text-foreground border px-1.5 py-0.5 font-mono text-[11px]"
              >
                {clientId}
              </Badge>{" "}
              is requesting access to interact with your Scylla workspace and
              tools. You can fine-tune exactly which capabilities this client is
              permitted to execute.
            </p>
          </div>

          {/* Permissions Header with Collapsible Toggle */}
          <div className="border-border rounded-xl border bg-background overflow-hidden">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsCustomizeExpanded((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsCustomizeExpanded((prev) => !prev);
                }
              }}
              className="flex items-center justify-between p-3.5 cursor-pointer select-none bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-foreground text-xs">
                  Permissions & Capabilities
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5",
                    enabledCount > 0
                      ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {enabledCount} of {ALL_MCP_CAPABILITIES.length} granted
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-[11px] font-medium">
                  {isCustomizeExpanded ? "Collapse" : "Customize"}
                </span>
                {isCustomizeExpanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </div>
            </div>

            {/* Quick Action Presets */}
            {isCustomizeExpanded && (
              <div className="border-border border-t px-3.5 py-2 bg-muted/5 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-muted-foreground font-medium">
                  Presets:
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                    onClick={handleClearAll}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Granular Permissions List */}
            {isCustomizeExpanded && (
              <div className="border-border border-t p-3 space-y-4 max-h-[380px] overflow-y-auto">
                {Object.entries(capabilitiesByCategory).map(
                  ([categoryKey, items]) => {
                    const catMeta = CATEGORY_META[categoryKey] || {
                      label: categoryKey,
                      icon: SlidersHorizontal,
                    };
                    const Icon = catMeta.icon;

                    return (
                      <div key={categoryKey} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider px-1">
                          <Icon className="size-3 text-orange-500" />
                          <span>{catMeta.label}</span>
                        </div>

                        <div className="space-y-1.5">
                          {items.map((cap) => {
                            const isChecked = selectedScopes.includes(cap.id);
                            return (
                              <div
                                key={cap.id}
                                role="checkbox"
                                aria-checked={isChecked}
                                tabIndex={0}
                                onClick={() =>
                                  handleToggleScope(cap.id, !isChecked)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleToggleScope(cap.id, !isChecked);
                                  }
                                }}
                                className={cn(
                                  "flex items-center justify-between gap-3 rounded-lg border p-2.5 transition-colors cursor-pointer select-none",
                                  isChecked
                                    ? cap.isDestructive
                                      ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
                                      : "border-border bg-card hover:bg-muted/30"
                                    : "border-border/60 bg-muted/10 opacity-70 hover:opacity-100",
                                )}
                              >
                                <div className="space-y-0.5 min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-foreground text-xs">
                                      {cap.label}
                                    </span>
                                    {cap.isDestructive && (
                                      <Badge
                                        variant="outline"
                                        className="gap-0.5 border-red-500/30 bg-red-500/10 text-[9px] font-semibold text-red-600 dark:text-red-400 px-1 py-0 h-4"
                                      >
                                        <AlertTriangle className="size-2.5" />
                                        Destructive
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-[11px] leading-tight">
                                    {cap.description}
                                  </p>
                                </div>

                                <Switch
                                  checked={isChecked}
                                  tabIndex={-1}
                                  className="pointer-events-none shrink-0"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>

          {/* Destructive Scopes Warning */}
          {hasDestructiveSelected && (
            <div className="border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl border p-3 text-[11px] flex items-start gap-2.5">
              <ShieldAlert className="size-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div>
                <span className="font-semibold">
                  Destructive Scopes Granted:
                </span>{" "}
                You have enabled permanent deletion capabilities for this
                client. The client will be able to delete resources within your
                permissions.
              </div>
            </div>
          )}

          {error && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-3 text-xs">
              {error}
            </div>
          )}

          {/* User Email Indicator */}
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
