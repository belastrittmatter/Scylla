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
import {
  SettingsPageHeader,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { userNameSchema } from "@/lib/validations/user";

/**
 * Brings the better-auth-ui cards in line with the settings groups: a 1px
 * border with no shadow, row-sized titles, and an untinted footer (this also
 * removes the destructive wash on the delete card).
 */
const authCardClassNames = {
  base: "gap-4 rounded-lg pt-4 pb-0 shadow-none",
  header: "px-4 sm:px-5",
  title: "text-sm font-medium md:text-sm",
  description: "text-xs md:text-xs",
  content: "px-4 sm:px-5",
  instructions: "text-start text-xs md:text-xs",
  footer: "items-start bg-transparent px-4 !py-3 sm:px-5 md:items-center",
};

export function AccountSettingsView() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-4 sm:p-6 lg:p-8">
      <SettingsPageHeader
        title="Account Settings"
        description="Your profile, connected accounts, AI agent access and sessions."
        action={
          <Link
            href="/settings"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 text-xs",
            )}
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Calendar & Display Preferences
          </Link>
        }
      />

      <SettingsSection
        eyebrow="Profile"
        description="Your avatar, name and primary email address."
        framed={false}
      >
        <UpdateAvatarCard classNames={authCardClassNames} />
        <UpdateFieldCard
          classNames={authCardClassNames}
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
        <ChangeEmailCard classNames={authCardClassNames} disabled />
      </SettingsSection>

      <SettingsSection
        eyebrow="Connected Accounts"
        description="Sign-in providers linked to your account. Google also connects your calendars."
      >
        <ConnectedAccountsCard />
      </SettingsSection>

      <SettingsSection
        eyebrow="AI Agents & MCP Integrations"
        description="Connect MCP clients and choose what each authorized agent can do."
      >
        <AgentCapabilitiesCard />
      </SettingsSection>

      <SettingsSection
        eyebrow="Security & Sessions"
        description="View active browser and device sessions and revoke access remotely."
        framed={false}
      >
        <SessionsCard classNames={authCardClassNames} />
      </SettingsSection>

      <SettingsSection
        eyebrow="Danger Zone"
        description="Permanently deletes your account and its data. This cannot be undone."
        tone="destructive"
        framed={false}
      >
        <DeleteAccountCard
          classNames={{
            ...authCardClassNames,
            base: cn(authCardClassNames.base, "border-destructive/40"),
            footer: cn(authCardClassNames.footer, "border-destructive/30"),
          }}
        />
      </SettingsSection>
    </div>
  );
}
