"use client";

import * as React from "react";
import type { Account } from "better-auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon, AuthUIContext } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ConnectedAccountsCard() {
  const {
    hooks: { useListAccounts },
    mutators: { unlinkAccount },
    authClient,
  } = React.useContext(AuthUIContext);

  const { data: accounts, isPending, refetch } = useListAccounts();
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  const googleAccount = accounts?.find(
    (account: Account) => account.providerId === "google",
  );
  const isGoogleConnected = Boolean(googleAccount);
  const canUnlinkGoogle = isGoogleConnected && (accounts?.length ?? 0) > 1;

  const handleLinkGoogle = async () => {
    if (!authClient) return;
    setIsActionLoading(true);
    try {
      const res = await authClient.linkSocial({
        provider: "google",
        callbackURL:
          typeof window !== "undefined"
            ? window.location.href
            : "/account/settings",
      });
      if (res?.error) {
        toast.error(res.error.message || "Failed to connect Google account");
        setIsActionLoading(false);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to connect Google account",
      );
      setIsActionLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!googleAccount || !unlinkAccount) return;
    setIsActionLoading(true);
    try {
      await unlinkAccount({
        accountId: googleAccount.accountId,
        providerId: "google",
      });
      await refetch?.();
      toast.success("Google account disconnected");
    } catch (err) {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "Failed to disconnect Google account";
      toast.error(errorMessage || "Failed to disconnect Google account");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
        {isPending ? (
          <>
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-7 w-16" />
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <GoogleIcon className="size-4 shrink-0" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Google</p>
                <p className="text-xs text-muted-foreground">
                  {isGoogleConnected
                    ? "Connected for sign-in and calendar sync"
                    : "Not connected"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant={isGoogleConnected ? "outline" : "default"}
              disabled={
                isActionLoading || (isGoogleConnected && !canUnlinkGoogle)
              }
              onClick={
                isGoogleConnected ? handleUnlinkGoogle : handleLinkGoogle
              }
              aria-label={isGoogleConnected ? "Unlink Google" : "Link Google"}
              className="shrink-0 gap-1.5 text-xs"
            >
              {isActionLoading && (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              )}
              {isGoogleConnected ? "Unlink" : "Link"}
            </Button>
          </>
        )}
      </div>
      {isGoogleConnected && !canUnlinkGoogle ? (
        <p className="-mt-1.5 px-4 pb-3.5 text-xs text-muted-foreground sm:px-5">
          Keep at least one connected account for sign-in.
        </p>
      ) : null}
    </div>
  );
}
