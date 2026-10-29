import { AuthUIProvider } from "@/components/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthUIProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthUIProvider>
  );
}
