import Link from "next/link";
import { GITHUB_REPO_URL } from "@/lib/github-repo";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Calendar", href: "/calendar" },
      { label: "Tasks", href: "/tasks" },
      { label: "Teams", href: "/teams" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: GITHUB_REPO_URL },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "AI & MCP Policy", href: "/ai-policy" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1200px] border-x border-dashed border-line px-5 pt-14 pb-8 sm:px-10">
        <div className="flex flex-col justify-between gap-12 lg:flex-row">
          <div>
            <img
              src="/images/logo-dark.svg"
              alt="Scylla"
              className="h-6 w-auto dark:hidden"
            />
            <img
              src="/images/logo.svg"
              alt="Scylla"
              className="hidden h-6 w-auto dark:block"
            />
            <p className="mt-4 max-w-[260px] text-sm text-ink-3">
              Meetings, rooms and project tasks in one place, for your team and
              its agents.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-10 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="font-code text-xs tracking-[0.12em] text-ink-3 uppercase">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        prefetch={false}
                        href={link.href}
                        className="text-sm text-ink-2 transition-colors hover:text-ember"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-14 border-t border-dashed border-line pt-6 font-code text-xs text-ink-3">
          © 2026 Scylla
        </p>
      </div>
    </footer>
  );
}
