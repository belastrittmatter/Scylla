"use client";

import * as React from "react";
import type { Account } from "better-auth";
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
import { ConnectedAccountRow } from "./connected-account-row";
import { Skeleton } from "@/components/ui/skeleton";

type Provider = "google" | "github";

const PROVIDER_LABEL: Record<Provider, string> = {
  google: "Google",
  github: "GitHub",
};

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.34-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function errorMessage(err: unknown, fallback: string): string {
  const message =
    typeof err === "object" && err !== null && "message" in err
      ? String(err.message)
      : "";
  return message || fallback;
}

export function ConnectedAccountsCard() {
  const {
    hooks: { useListAccounts },
    mutators: { unlinkAccount },
    authClient,
  } = React.useContext(AuthUIContext);

  const { data: accounts, isPending, refetch } = useListAccounts();
  const [busy, setBusy] = React.useState<Provider | null>(null);

  const findAccount = (provider: Provider) =>
    accounts?.find((account: Account) => account.providerId === provider);
  const googleAccount = findAccount("google");
  const githubAccount = findAccount("github");
  const hasMultiple = (accounts?.length ?? 0) > 1;
  const onlyOneConnected = Boolean(accounts?.length === 1);

  const link = async (provider: Provider) => {
    if (!authClient) return;
    const label = PROVIDER_LABEL[provider];
    setBusy(provider);
    try {
      const res = await authClient.linkSocial({
        provider,
        callbackURL:
          typeof window !== "undefined"
            ? window.location.href
            : "/account/settings",
      });
      if (res?.error) {
        toast.error(res.error.message || `Failed to connect ${label} account`);
        setBusy(null);
      }
    } catch (err) {
      toast.error(errorMessage(err, `Failed to connect ${label} account`));
      setBusy(null);
    }
  };

  const unlink = async (provider: Provider, account?: Account) => {
    if (!account || !unlinkAccount) return;
    const label = PROVIDER_LABEL[provider];
    setBusy(provider);
    try {
      await unlinkAccount({
        accountId: account.accountId,
        providerId: provider,
      });
      await refetch?.();
      toast.success(`${label} account disconnected`);
    } catch (err) {
      toast.error(errorMessage(err, `Failed to disconnect ${label} account`));
    } finally {
      setBusy(null);
    }
  };

  const rowSkeleton = (
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
  );

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
          rowSkeleton
        ) : (
          <>
            <ConnectedAccountRow
              providerName="Google"
              icon={<GoogleIcon className="size-4 shrink-0" />}
              connectedText="Connected for calendar sync & authentication"
              isConnected={Boolean(googleAccount)}
              canUnlink={hasMultiple}
              isBusy={busy === "google"}
              disabled={busy !== null}
              onLink={() => link("google")}
              onUnlink={() => unlink("google", googleAccount)}
            />
            <ConnectedAccountRow
              providerName="GitHub"
              icon={<GithubIcon className="size-4 shrink-0" />}
              connectedText="Connected for issues, branches & pull requests"
              isConnected={Boolean(githubAccount)}
              canUnlink={hasMultiple}
              isBusy={busy === "github"}
              disabled={busy !== null}
              onLink={() => link("github")}
              onUnlink={() => unlink("github", githubAccount)}
            />
          </>
        )}
        {!isPending && onlyOneConnected ? (
          <p className="text-xs text-muted-foreground">
            Keep at least one connected account for sign-in.
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
        <span>
          Google connects your calendars and identity. GitHub connects
          repositories, issues, and pull requests.
        </span>
      </CardFooter>
    </Card>
  );
}
