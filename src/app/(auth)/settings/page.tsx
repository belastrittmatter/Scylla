import { SettingsView } from "@/components/settings/settings-view";

export const metadata = {
  title: "Settings | Scylla MCP",
  description: "Configure calendar view, appearance themes, and scheduling preferences.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
