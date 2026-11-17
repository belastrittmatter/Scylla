import Link from "next/link";
import localFont from "next/font/local";
import { LandingLogo } from "@/components/landing/primitives";
import { LandingThemeToggle } from "@/components/landing/theme-toggle";

/** Same mono face as the landing (eyebrows, times, durations). */
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

/**
 * Public booking frame: the landing's paper/ink/line palette scoped to this
 * route, with the app's shadcn tokens bridged onto it so shared controls
 * (calendar, inputs, buttons) pick up the same surfaces and ember accent.
 * Ember fills carry text at AA: light fills with ember-deep under surface
 * text, dark keeps the brighter ember under paper text.
 * The app-wide :root/.dark tokens are untouched.
 */
const tokenBridge = [
  "[--background:var(--surface)]",
  "[--foreground:var(--ink)]",
  "[--card:var(--surface)]",
  "[--card-foreground:var(--ink)]",
  "[--muted:var(--paper)]",
  "[--muted-foreground:var(--ink-2)]",
  "[--accent:var(--line)]",
  "[--accent-foreground:var(--ink)]",
  "[--border:var(--line)]",
  "[--input:var(--line)]",
  "[--primary:var(--ember-deep)]",
  "[--primary-foreground:var(--surface)]",
  "dark:[--primary:var(--ember)]",
  "dark:[--primary-foreground:var(--paper)]",
  "[--ring:var(--ember)]",
].join(" ");

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`landing ${mapleMono.variable} ${tokenBridge} flex min-h-screen flex-col overflow-x-clip selection:bg-primary selection:text-primary-foreground`}
    >
      <header className="border-line border-b">
        <div className="border-line mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-3 border-x border-dashed px-4 sm:px-10">
          <Link prefetch={false} href="/" className="shrink-0">
            <LandingLogo />
          </Link>
          <LandingThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <div className="border-line mx-auto w-full max-w-[1200px] flex-1 border-x border-dashed px-4 py-6 sm:px-10 sm:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
