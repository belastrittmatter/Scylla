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

type Provider = "google" | "github";
const LABELS: Record<Provider, string> = { google: "Google", github: "GitHub" };

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.82 1.18 3.08 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
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
  const [busyProvider, setBusyProvider] = React.useState<Provider | null>(null);

  const findAccount = (provider: Provider) =>
    accounts?.find((account: Account) => account.providerId === provider);
  const canUnlink = (accounts?.length ?? 0) > 1;

  const link = async (provider: Provider) => {
    const name = LABELS[provider];
    if (!authClient) return;
    setBusyProvider(provider);
    try {
      const res = await authClient.linkSocial({
        provider,
        callbackURL:
          typeof window !== "undefined"
            ? window.location.href
            : "/account/settings",
      });
      if (res?.error) {
        toast.error(res.error.message || `Failed to connect ${name} account`);
        setBusyProvider(null);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to connect ${name} account`,
      );
      setBusyProvider(null);
    }
  };

  const unlink = async (provider: Provider) => {
    const account = findAccount(provider);
    const name = LABELS[provider];
    if (!account || !unlinkAccount) return;
    setBusyProvider(provider);
    try {
      await unlinkAccount({
        accountId: account.accountId,
        providerId: provider,
      });
      await refetch?.();
      toast.success(`${name} account disconnected`);
    } catch (err) {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : `Failed to disconnect ${name} account`;
      toast.error(errorMessage || `Failed to disconnect ${name} account`);
    } finally {
      setBusyProvider(null);
    }
  };

  const rowProps = (provider: Provider, connectedText: string) => ({
    providerName: LABELS[provider],
    isLoading: isPending,
    isConnected: Boolean(findAccount(provider)),
    connectedText,
    canUnlink,
    isBusy: busyProvider !== null,
    onLink: () => void link(provider),
    onUnlink: () => void unlink(provider),
  });
  const onlyOne = !isPending && (accounts?.length ?? 0) === 1;

  return (
    <Card className="w-full gap-6 pt-6 pb-0 text-start shadow-xs">
      <CardHeader className="gap-1.5 px-6">
        <CardTitle className="text-lg font-semibold md:text-xl">
          Connected Accounts
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground md:text-sm">
          Connect third-party OAuth providers for single sign-on, calendar sync
          and GitHub issues, branches and pull requests.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 px-6 pb-6">
        <ConnectedAccountRow
          {...rowProps(
            "google",
            "Connected for calendar sync & authentication",
          )}
          icon={<GoogleIcon className="size-4 shrink-0" />}
        />
        <ConnectedAccountRow
          {...rowProps(
            "github",
            "Connected for issues, branches and pull requests",
          )}
          icon={<GithubIcon className="size-4 shrink-0" />}
        />
        {onlyOne ? (
          <p className="text-xs text-muted-foreground">
            Keep at least one connected account for sign-in.
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
        <span>
          Google OAuth connects your calendars, agenda, and identity. GitHub
          lets you be assigned tasks on repository-linked projects.
        </span>
      </CardFooter>
    </Card>
  );
}
