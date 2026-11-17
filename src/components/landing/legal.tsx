import { Children, isValidElement } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/github-repo";
import { Eyebrow } from "@/components/landing/primitives";
import { LegalToc, type LegalTocItem } from "@/components/landing/legal-toc";

export const LEGAL_LAST_UPDATED = "November 17, 2026";

/**
 * Inline link inside legal copy. Ink text with an ember underline keeps
 * AA contrast in both themes; the underline means color is never the only cue.
 */
export const legalLinkClass =
  "rounded-sm text-ink underline decoration-ember/60 underline-offset-4 transition-colors hover:text-ember-deep hover:decoration-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember";

const CONTACT_TITLE = "Contact";

/** "4. Google user data" → { num: "4.", label: "Google user data" }. */
function splitTitle(title: string): { num: string | null; label: string } {
  const match = /^(\d+\.)\s+(.+)$/.exec(title);
  return match ? { num: match[1], label: match[2] } : { num: null, label: title };
}

function sectionId(title: string): string {
  return splitTitle(title)
    .label.toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Table-of-contents entries, read from the LegalSection titles in order. */
function tocItems(children: React.ReactNode): LegalTocItem[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ title?: string }>(child)) return [];
    const title =
      child.type === LegalSection
        ? child.props.title
        : child.type === LegalContact
          ? CONTACT_TITLE
          : undefined;
    return title ? [{ id: sectionId(title), ...splitTitle(title) }] : [];
  });
}

/** Shared frame for /privacy, /terms and /ai-policy. */
export function LegalPage({
  badge,
  title,
  children,
}: {
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  const toc = tocItems(children);

  return (
    <section>
      <div className="mx-auto w-full max-w-[1200px] border-x border-dashed border-line px-5 sm:px-10">
        <div className="py-16 sm:py-24 lg:grid lg:grid-cols-[minmax(0,1fr)_35rem] lg:gap-x-12 xl:grid-cols-[minmax(0,1fr)_35rem_minmax(0,1fr)]">
          {toc.length > 0 && (
            <nav
              aria-label="On this page"
              className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-8rem)] lg:max-w-60 lg:self-start lg:overflow-y-auto"
            >
              <Eyebrow className="mb-5 text-ink-2">On this page</Eyebrow>
              <LegalToc items={toc} />
            </nav>
          )}

          <div className="min-w-0">
            <header className="mb-10 sm:mb-12">
              <Eyebrow className="text-ink-2">{badge}</Eyebrow>
              <h1 className="mt-5 text-balance text-[32px] leading-[1.1] font-medium tracking-[-0.025em] text-ink sm:text-[44px]">
                {title}
              </h1>
              <p className="mt-4 text-sm text-ink-2">
                Last updated:{" "}
                <time className="font-code">{LEGAL_LAST_UPDATED}</time>
              </p>
            </header>
            <div className="space-y-12 text-base leading-relaxed text-pretty text-ink-2 sm:space-y-14">
              {children}
            </div>
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
  const id = sectionId(title);
  const { num, label } = splitTitle(title);

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 border-t border-line pt-10"
    >
      <h2
        id={`${id}-title`}
        className="flex items-baseline gap-3 text-2xl leading-tight font-medium tracking-[-0.02em] text-balance text-ink"
      >
        {num && (
          <span className="shrink-0 font-code text-base font-normal tracking-normal text-ink-2 tabular-nums">
            {num}
          </span>
        )}{" "}
        <span className="min-w-0">{label}</span>
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc space-y-3 pl-5 text-ink-2 marker:text-ink-3 [&_strong]:font-medium">
      {children}
    </ul>
  );
}

/** Same demo notice at the top of every legal page. */
export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <aside
      aria-label="This is a demo, not a product"
      className="space-y-3 rounded-xl border border-line bg-surface p-5 sm:p-6"
    >
      <Eyebrow className="text-ink">This is a demo, not a product</Eyebrow>
      <p>
        The Scylla instance on this website is a free, non-commercial
        demonstration of an{" "}
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={legalLinkClass}
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
    </aside>
  );
}

export function LegalLinks({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <p className="text-sm text-ink-2">
      See also{" "}
      {links.map((link, i) => (
        <span key={link.href}>
          {i > 0 && " and "}
          <Link href={link.href} className={legalLinkClass}>
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
    <LegalSection title={CONTACT_TITLE}>
      <p>{children}</p>
      <div className="flex items-start gap-3 border-y border-line py-4">
        <MessageSquare
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-ink-3"
        />
        <a
          href={`${GITHUB_REPO_URL}/issues`}
          target="_blank"
          rel="noopener noreferrer"
          className={`min-w-0 font-code text-sm [overflow-wrap:anywhere] ${legalLinkClass}`}
        >
          {/* <wbr> lets the URL wrap at its slashes on narrow screens. */}
          github.com/
          <wbr />
          belastrittmatter/
          <wbr />
          Scylla/
          <wbr />
          issues
        </a>
      </div>
      <p className="text-sm">
        Issues are public. Never post personal data, tokens or security details
        in them. If your request involves any of that, open an issue that only
        asks for a private contact, and a maintainer will follow up.
      </p>
    </LegalSection>
  );
}
