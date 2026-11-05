"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import {
  UpdateAvatarCard,
  UpdateFieldCard,
  ChangeEmailCard,
  DeleteAccountCard,
  SessionsCard,
} from "@daveyplate/better-auth-ui";
import { useSession } from "@/lib/auth-client";
import { ConnectedAccountsCard } from "@/components/settings/connected-accounts-card";
import { AgentCapabilitiesCard } from "@/components/settings/agent-capabilities-card";
import { userNameSchema } from "@/lib/validations/user";

export function AccountSettingsView() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto max-w-4xl space-y-10 p-4 sm:p-6 lg:p-8">
      {/* Header with Title, Description, and Navigation back to App Settings */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage your personal profile, credentials, connected accounts, and
            security preferences.
          </p>
        </div>

        <Link
          href="/settings"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1.5 border-neutral-200 text-xs text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
          )}
        >
          <ArrowLeft className="size-3.5" />
          Calendar & Display Preferences
        </Link>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Profile
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Manage your public avatar, name, and primary email address.
            </p>
          </div>
          <div className="space-y-4">
            <UpdateAvatarCard />
            <UpdateFieldCard
              name="name"
              label="Name"
              value={session?.user.name}
              description="Please enter your full name, or a display name you are comfortable with."
              instructions="Please use 32 characters at maximum."
              placeholder="Enter your name"
              required
              validate={(val: string) => userNameSchema.safeParse(val).success}
              errorMessage={{
                required: "Name cannot be empty.",
                validate: "Name must be between 1 and 32 characters.",
              }}
            />
            <ChangeEmailCard disabled />
          </div>
        </section>

        {/* Connected Accounts Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Connected Accounts
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Manage third-party OAuth providers and linked logins.
            </p>
          </div>
          <div className="space-y-4">
            <ConnectedAccountsCard />
          </div>
        </section>

        {/* AI Agents & Capabilities Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              AI Agents &amp; MCP Integrations
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Manage capability grants and access permissions for autonomous AI
              agents.
            </p>
          </div>
          <div className="space-y-4">
            <AgentCapabilitiesCard />
          </div>
        </section>

        {/* Security & Sessions Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Security & Sessions
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              View active browser and device sessions and revoke access
              remotely.
            </p>
          </div>
          <div className="space-y-4">
            <SessionsCard />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-red-600 dark:text-red-400">
              Danger Zone
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Irreversible account deletion and permanent data purge.
            </p>
          </div>
          <div className="space-y-4">
            <DeleteAccountCard />
          </div>
        </section>
      </div>
    </div>
  );
}
