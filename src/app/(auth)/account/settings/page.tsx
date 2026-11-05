import { AccountSettingsView } from "@/components/settings/account-settings-view";

export const metadata = {
  title: "Account Settings | Scylla MCP",
  description:
    "Manage your personal profile, credentials, and security preferences.",
};

export default function AccountSettingsPage() {
  return <AccountSettingsView />;
}
