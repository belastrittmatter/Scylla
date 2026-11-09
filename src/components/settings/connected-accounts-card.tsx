"use client";

import * as React from "react";
import type { Account } from "better-auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon, AuthUIContext } from "@daveyplate/better-auth-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export function ConnectedAccountsCard() {
  const {
    hooks: { useListAccounts },
    mutators: { unlinkAccount },
    authClient,
  } = React.useContext(AuthUIContext);

  const { data: accounts, isPending, refetch } = useListAccounts();
  const [actionLoadingProvider, setActionLoadingProvider] = React.useState<
    string | null
  >(null);

  const googleAccount = accounts?.find(
    (account: Account) => account.providerId === "google",
  );
  const isGoogleConnected = Boolean(googleAccount);
  const canUnlinkGoogle = isGoogleConnected && (accounts?.length ?? 0) > 1;

  const githubAccount = accounts?.find(
    (account: Account) => account.providerId === "github",
  );
  const isGithubConnected = Boolean(githubAccount);
  const canUnlinkGithub = isGithubConnected && (accounts?.length ?? 0) > 1;

  const handleLinkSocial = async (provider: "google" | "github") => {
    if (!authClient) return;
    setActionLoadingProvider(provider);
    try {
      const res = await authClient.linkSocial({
        provider,
        callbackURL:
          typeof window !== "undefined"
            ? window.location.href
            : "/account/settings",
      });
      if (res?.error) {
        toast.error(
          res.error.message ||
            `Failed to connect ${provider === "google" ? "Google" : "GitHub"} account`,
        );
        setActionLoadingProvider(null);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to connect ${provider === "google" ? "Google" : "GitHub"} account`,
      );
      setActionLoadingProvider(null);
    }
  };

  const handleUnlink = async (account: Account) => {
    if (!unlinkAccount) return;
    setActionLoadingProvider(account.providerId);
    try {
      await unlinkAccount({
        accountId: account.accountId,
        providerId: account.providerId,
      });
      await refetch?.();
      toast.success(
        `${account.providerId === "google" ? "Google" : "GitHub"} account disconnected`,
      );
    } catch (err) {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "Failed to disconnect account";
      toast.error(errorMessage || "Failed to disconnect account");
    } finally {
      setActionLoadingProvider(null);
    }
  };

  return (
    <Card className="w-full gap-6 pt-6 pb-0 text-start shadow-xs">
      <CardHeader className="gap-1.5 px-6">
        <CardTitle className="text-lg font-semibold md:text-xl">
          Connected Accounts
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground md:text-sm">
          Connect third-party OAuth providers for single sign-on, calendar sync,
          and GitHub issue tracking.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 px-6 pb-6">
        {isPending ? (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-5 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ) : (
          <>
            {/* Google Row */}
            <div className="flex items-center justify-between rounded-lg border p-4 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border bg-background shadow-2xs">
                  <GoogleIcon className="size-4 shrink-0" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Google</span>
                  <span className="text-xs text-muted-foreground">
                    {isGoogleConnected
                      ? "Connected for calendar sync & authentication"
                      : "Not connected"}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant={isGoogleConnected ? "outline" : "default"}
                disabled={
                  Boolean(actionLoadingProvider) ||
                  (isGoogleConnected && !canUnlinkGoogle)
                }
                onClick={
                  isGoogleConnected && googleAccount
                    ? () => handleUnlink(googleAccount)
                    : () => handleLinkSocial("google")
                }
                className="gap-1.5 text-xs"
              >
                {actionLoadingProvider === "google" && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                {isGoogleConnected ? "Unlink" : "Link"}
              </Button>
            </div>

            {/* GitHub Row */}
            <div className="flex items-center justify-between rounded-lg border p-4 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border bg-background shadow-2xs">
                  <GitHubIcon className="size-4 shrink-0" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">GitHub</span>
                  <span className="text-xs text-muted-foreground">
                    {isGithubConnected
                      ? "Connected for issue & repository tracking"
                      : "Not connected"}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant={isGithubConnected ? "outline" : "default"}
                disabled={
                  Boolean(actionLoadingProvider) ||
                  (isGithubConnected && !canUnlinkGithub)
                }
                onClick={
                  isGithubConnected && githubAccount
                    ? () => handleUnlink(githubAccount)
                    : () => handleLinkSocial("github")
                }
                className="gap-1.5 text-xs"
              >
                {actionLoadingProvider === "github" && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                {isGithubConnected ? "Unlink" : "Link"}
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
        <span>
          Connect Google for calendar scheduling and GitHub for repository &amp;
          task issue synchronization.
        </span>
      </CardFooter>
    </Card>
  );
}
