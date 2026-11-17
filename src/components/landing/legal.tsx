import Link from "next/link";
import { FlaskConical, MessageSquare, type LucideIcon } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/github-repo";

export const LEGAL_LAST_UPDATED = "November 17, 2026";

/** Shared frame for /privacy, /terms and /ai-policy. */
export function LegalPage({
  icon: Icon,
  badge,
  title,
  children,
}: {
  icon: LucideIcon;
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mx-auto w-full max-w-[1200px] border-x border-dashed border-line px-5 sm:px-10">
        <div className="py-20 sm:py-28">
          <div className="mx-auto mb-12 max-w-[800px] text-center sm:mb-16">
            <span className="mb-5 inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 font-code text-xs text-ink-2">
              <Icon className="mr-1.5 inline-block size-3.5 text-ember" />
              {badge}
            </span>
            <h1 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
              {title}
            </h1>
            <p className="mt-3 text-sm text-ink-2 sm:text-base">
              Last updated: {LEGAL_LAST_UPDATED}
            </p>
          </div>
          <div className="mx-auto max-w-[840px] space-y-10 text-sm leading-relaxed text-ink-2 sm:text-base">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium tracking-tight text-ink sm:text-2xl">
        {title}
      </h2>
      {children}
    </div>
  );
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6 text-ink-2">{children}</ul>;
}

/** Same demo notice at the top of every legal page. */
export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-ember/30 bg-ember-soft p-6">
      <h2 className="flex items-center gap-2 text-lg font-medium text-ink">
        <FlaskConical className="size-5 text-ember" />
        This is a demo, not a product
      </h2>
      <p>
        The Scylla instance on this website is a free, non-commercial
        demonstration of an{" "}
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ember underline hover:text-ember-deep"
        >
          open-source project
        </a>
        . It comes with no warranty, no uptime or support commitment and no
        promise that anything works. It can break, change, be reset or be shut
        down at any time without notice, and any data in it can be lost. Do not
        rely on it for real scheduling, and do not put confidential or sensitive
        information into it.
      </p>
      {children}
    </div>
  );
}

export function LegalLinks({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <p className="text-xs text-ink-2 sm:text-sm">
      See also{" "}
      {links.map((link, i) => (
        <span key={link.href}>
          {i > 0 && " and "}
          <Link
            href={link.href}
            className="text-ember underline hover:text-ember-deep"
          >
            {link.label}
          </Link>
        </span>
      ))}
      .
    </p>
  );
}

export function LegalContact({ children }: { children: React.ReactNode }) {
  return (
    <LegalSection title="Contact">
      <p>{children}</p>
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-5">
        <MessageSquare className="size-5 text-ember" />
        <a
          href={`${GITHUB_REPO_URL}/issues`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-ink underline underline-offset-4 hover:text-ember"
        >
          github.com/belastrittmatter/Scylla/issues
        </a>
      </div>
      <p className="text-xs sm:text-sm">
        Issues are public. Never post personal data, tokens or security details
        in them. If your request involves any of that, open an issue that only
        asks for a private contact, and a maintainer will follow up.
      </p>
    </LegalSection>
  );
}
