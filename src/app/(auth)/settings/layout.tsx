import { settingsMonoFont } from "@/components/settings/settings-mono-font";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${settingsMonoFont.variable} contents`}>{children}</div>;
}
