"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
import {
  ShieldCheck,
  CalendarDays,
  Lock,
  Bot,
  ArrowRight,
  Loader2,
  CalendarCheck,
  Building2,
} from "lucide-react";

function extractOAuthQuery(searchString: string): string {
  const search = searchString.replace(/^\?/, "");
  if (!search) return "";
  const params = new URLSearchParams(search);
  if (params.get("oauth_query")) {
    return params.get("oauth_query")!;
  }
  if (!params.has("sig")) {
    return search;
  }
  const signedParamNames = params.getAll("ba_param");
  if (!signedParamNames.length) {
    return search;
  }
  const signedSet = new Set(signedParamNames);
  const signedParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (key === "sig" || key === "ba_param" || signedSet.has(key)) {
      signedParams.append(key, value);
    }
  }
  return signedParams.toString();
}

function ConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();

  const clientId = searchParams.get("client_id") || "Unknown Client";
  const scope = searchParams.get("scope") || "";
  const consentCode =
    searchParams.get("consent_code") || searchParams.get("code");

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConsent = async (accept: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const search =
        typeof window !== "undefined"
          ? window.location.search
          : searchParams.toString();
      const oauthQuery = extractOAuthQuery(search);

      const res = await fetch("/api/auth/oauth2/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          accept,
          scope: scope || undefined,
          consent_code: consentCode || undefined,
          oauth_query: oauthQuery || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error_description ||
            data.message ||
            data.error ||
            "Failed to submit consent",
        );
      }

      if (data.redirectURI || data.url) {
        window.location.href = data.redirectURI || data.url;
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
            tools and calendar access to MCP clients.
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

      <Card className="border-border bg-card w-full max-w-lg overflow-hidden rounded-2xl p-0 shadow-xl">
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
              is requesting access to interact with your Google Calendar and
              Scylla workspace tools.
            </p>
          </div>

          {/* Requested Scopes */}
          <div className="space-y-2.5">
            <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
              Granted Tool Capabilities
            </div>
            <div className="space-y-2">
              <div className="border-border bg-background flex items-start gap-3 rounded-xl border p-3">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <CalendarDays className="size-3.5" />
                </div>
                <div>
                  <div className="text-foreground font-semibold">
                    Read Free/Busy Availability
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Query schedule free slots and busy periods for you and
                    invited colleagues.
                  </p>
                </div>
              </div>

              <div className="border-border bg-background flex items-start gap-3 rounded-xl border p-3">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <CalendarCheck className="size-3.5" />
                </div>
                <div>
                  <div className="text-foreground font-semibold">
                    Schedule & Reschedule Meetings
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Create calendar events with auto-generated Google Meet video
                    conference links.
                  </p>
                </div>
              </div>

              <div className="border-border bg-background flex items-start gap-3 rounded-xl border p-3">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Building2 className="size-3.5" />
                </div>
                <div>
                  <div className="text-foreground font-semibold">
                    Reserve Physical Meeting Rooms
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Browse office room facilities and reserve equipped
                    workspaces automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

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
                <span>Allow Access</span>
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
