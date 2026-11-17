"use client";

import * as React from "react";
import {
  UpdateAvatarCard,
  UpdateFieldCard,
  DeleteAccountCard,
  SessionsCard,
  type AuthLocalization,
} from "@daveyplate/better-auth-ui";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectedAccountsCard } from "@/components/settings/connected-accounts-card";
import { AgentCapabilitiesCard } from "@/components/settings/agent-capabilities-card";
import {
  SettingRow,
  SettingsPageHeader,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { userNameSchema } from "@/lib/validations/user";

/*
 * better-auth-ui renders each setting as its own card. These classNames strip
 * the card chrome (border, radius, shadow, tinted footer) so every card becomes
 * one hairline-divided row inside a framed SettingsSection: label and help on
 * the left, the control on the right.
 */
const flatChrome = "rounded-none border-0 bg-transparent shadow-none";
const flatCard = `${flatChrome} gap-0 py-0`;
const rowHeader = "gap-0.5 px-0";
const rowTitle = "text-sm leading-5 font-medium md:text-sm";
const rowDescription = "text-xs md:text-xs";
const flatFooter = `${flatChrome} !p-0`;
/** Outline at rest; turns ember only while its own form has focus. */
const quietSave =
  "h-8 border border-border bg-background text-xs text-foreground shadow-none hover:bg-muted [form:focus-within_&]:border-primary [form:focus-within_&]:bg-primary [form:focus-within_&]:text-primary-foreground [form:focus-within_&]:hover:bg-primary/90";

const avatarClassNames = {
  // The avatar trigger hard-codes me-6 and the header self-start; re-centre both.
  // border-b restores the group hairline that border-0 would cancel (divide-y
  // has zero specificity against the card's own border classes).
  base: `${flatCard} border-b px-4 py-3 sm:px-5 [&>div>button]:me-0 [&>div>button]:self-center [&_[data-slot=card-header]]:self-center`,
  header: rowHeader,
  title: rowTitle,
  description: rowDescription,
  avatar: { base: "size-10 text-sm" },
  footer: "hidden",
};

const nameClassNames = {
  base: `${flatChrome} grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-3 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)_auto] sm:gap-x-3 sm:px-5`,
  header: `${rowHeader} col-span-2 self-center sm:col-span-1`,
  title: rowTitle,
  description: rowDescription,
  content: "px-0",
  input: "h-8 text-sm md:text-sm",
  error: "text-xs",
  instructions: "hidden",
  footer: `${flatFooter} self-start`,
  button: quietSave,
};

const sessionsClassNames = {
  base: flatCard,
  header: "hidden",
  content: "gap-0 divide-y divide-border px-0",
  cell: "rounded-none border-0 bg-transparent px-4 py-3.5 shadow-none sm:px-5",
  icon: "text-muted-foreground",
  button: "h-8 text-xs shadow-none",
  footer: "hidden",
};

/*
 * The delete dialog reuses classNames.title, .description and
 * .destructiveButton, so the row styles are scoped to the card's own slots and
 * the dialog keeps its full-size title and solid confirm button.
 */
const deleteClassNames = {
  base: [
    flatCard,
    "flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5",
    "[&_[data-slot=card-title]]:text-sm [&_[data-slot=card-title]]:leading-5 [&_[data-slot=card-title]]:font-medium [&_[data-slot=card-description]]:text-xs",
    "[&_[data-slot=card-footer]_button]:h-8 [&_[data-slot=card-footer]_button]:border [&_[data-slot=card-footer]_button]:border-destructive/40 [&_[data-slot=card-footer]_button]:bg-transparent [&_[data-slot=card-footer]_button]:text-xs [&_[data-slot=card-footer]_button]:text-destructive [&_[data-slot=card-footer]_button]:shadow-none [&_[data-slot=card-footer]_button:hover]:bg-destructive/10",
  ].join(" "),
  header: `${rowHeader} min-w-0 flex-1`,
  footer: `${flatFooter} shrink-0 items-start`,
};

const avatarLocalization: AuthLocalization = {
  AVATAR_DESCRIPTION: "Click the avatar to upload one.",
};

const deleteLocalization: AuthLocalization = {
  DELETE_ACCOUNT_DESCRIPTION:
    "Permanently deletes your account and its data. This cannot be undone.",
};

function EmailRow() {
  const { data: session, isPending } = useSession();
  const email = session?.user.email;

  return (
    <SettingRow label="Email" description="The address you sign in with.">
      {isPending ? (
        <Skeleton className="h-4 w-40" />
      ) : (
        <span className="max-w-full truncate text-sm text-foreground sm:max-w-72">
          {email}
        </span>
      )}
    </SettingRow>
  );
}

export function AccountSettingsView() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-4 sm:p-6 lg:p-8">
      <SettingsPageHeader
        active="account"
        description="Your profile, connected accounts, AI agent access and sessions."
      />

      <SettingsSection
        eyebrow="Profile"
        description="Your avatar, name and primary email address."
      >
        <UpdateAvatarCard
          classNames={avatarClassNames}
          localization={avatarLocalization}
        />
        <UpdateFieldCard
          classNames={nameClassNames}
          name="name"
          label="Name"
          value={session?.user.name}
          description="Your full name or a display name. Up to 32 characters."
          placeholder="Enter your name"
          required
          validate={(val: string) => userNameSchema.safeParse(val).success}
          errorMessage={{
            required: "Name cannot be empty.",
            validate: "Name must be between 1 and 32 characters.",
          }}
        />
        <EmailRow />
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
      >
        <SessionsCard classNames={sessionsClassNames} />
      </SettingsSection>

      <SettingsSection eyebrow="Danger Zone" tone="destructive">
        <DeleteAccountCard
          classNames={deleteClassNames}
          localization={deleteLocalization}
        />
      </SettingsSection>
    </div>
  );
}
