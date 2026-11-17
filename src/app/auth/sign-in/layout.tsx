import type { Metadata } from "next";
import localFont from "next/font/local";

/** The landing's mono (behind `font-code`) is loaded per layout; sign-in uses it for eyebrows and machine values. */
const mapleMono = localFont({
  src: "../../../fonts/maple-mono-nf-regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-maple",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sign in · Scylla",
  description: "Sign in to Scylla with your Google account.",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={mapleMono.variable}>{children}</div>;
}
