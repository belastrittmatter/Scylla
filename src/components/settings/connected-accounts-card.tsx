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
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to disconnect Google account",
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <Card className="w-full gap-6 pt-6 pb-0 text-start shadow-xs">
      <CardHeader className="gap-1.5 px-6">
        <CardTitle className="text-lg font-semibold md:text-xl">
          Connected Accounts
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground md:text-sm">
          Connect third-party OAuth providers for single sign-on and calendar
          sync.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6">
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
              disabled={isActionLoading}
              onClick={
                isGoogleConnected ? handleUnlinkGoogle : handleLinkGoogle
              }
              className="gap-1.5 text-xs"
            >
              {isActionLoading && <Loader2 className="size-3.5 animate-spin" />}
              {isGoogleConnected ? "Unlink" : "Link"}
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
        <span>Google OAuth connects your calendars, agenda, and identity.</span>
      </CardFooter>
    </Card>
  );
}
