import { headers } from "next/headers";
import localFont from "next/font/local";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthUIProvider } from "@/components/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";

/** The landing's mono face, for eyebrows, IDs, counts and kbd hints (font-code / font-mono). */
const mapleMono = localFont({
  src: [
    {
      path: "../../fonts/maple-mono-nf-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-maple",
  display: "swap",
});

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <>
      {/* On :root, not a wrapper, so portalled UI (mobile sidebar sheet, popovers) gets the face too. */}
      <style>{`:root{--font-maple:${mapleMono.style.fontFamily};}`}</style>
      <AuthUIProvider>
        <DashboardShell>{children}</DashboardShell>
      </AuthUIProvider>
    </>
  );
}
