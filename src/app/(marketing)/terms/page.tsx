import type { Metadata } from "next";
import Link from "next/link";
import { Scale } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/github-repo";
import {
  DemoNotice,
  LegalContact,
  LegalLinks,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/landing/legal";

export const metadata: Metadata = {
  title: "Terms of Service | Scylla",
  description:
    "Terms for using the hosted Scylla demo: a free, open-source demonstration with no warranty or uptime commitment.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage icon={Scale} badge="Legal" title="Terms of Service">
      <DemoNotice>
        <LegalLinks
          links={[
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/ai-policy", label: "AI & MCP Policy" },
          ]}
        />
      </DemoNotice>

      <LegalSection title="1. Who we are and what these terms cover">
        <p>
          Scylla is an open-source project developed in public on{" "}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ember underline hover:text-ember-deep"
          >
            GitHub
          </a>
          . &ldquo;We&rdquo; means the project&apos;s maintainers, who run the
          hosted demo on this website (the &ldquo;Demo&rdquo;). These terms
          apply to your use of the Demo. By signing in, connecting a calendar or
          connecting an AI assistant, you accept them. If you don&apos;t, please
          don&apos;t use the Demo.
        </p>
        <p>
          If you run your own copy of Scylla, you are its operator. These terms
          and our policies do not cover your instance, and we have no access to
          it.
        </p>
      </LegalSection>

      <LegalSection title="2. What the Demo does">
        <p>The Demo lets you try Scylla&apos;s features:</p>
        <LegalList>
          <li>
            Team calendars and shared availability, read from Google Calendar.
          </li>
          <li>
            Meeting rooms from your Google Workspace and booking meetings, with
            Google Meet links, in your Google Calendar.
          </li>
          <li>Shareable booking links that guests can use to pick a slot.</li>
          <li>
            Teams, projects, task boards, task comments and time tracking.
          </li>
          <li>
            A Model Context Protocol (MCP) server that AI assistants you connect
            can use on your behalf.
          </li>
        </LegalList>
        <p>
          Features are experimental and can change, break or be removed at any
          time.
        </p>
      </LegalSection>

      <LegalSection title="3. No guarantees">
        <p>
          The Demo is provided free of charge and for evaluation only. We
          don&apos;t promise that it is available, correct, secure or suitable
          for any purpose. In particular, it may show wrong availability, book
          the wrong time or room, fail to send or cancel invites, or lose data.
          Always check important meetings directly in Google Calendar. We may
          reset the database, delete accounts or data, or shut the Demo down at
          any time, without notice and without keeping backups for you.
        </p>
      </LegalSection>

      <LegalSection title="4. Your account and your actions">
        <LegalList>
          <li>
            You sign in with a Google account. Only connect a calendar or Google
            Workspace you are allowed to use this way. If it belongs to an
            organization, make sure that organization allows it.
          </li>
          <li>
            You are responsible for what happens through your account, including
            actions taken by AI assistants you connect (see the{" "}
            <Link
              href="/ai-policy"
              className="text-ember underline hover:text-ember-deep"
            >
              AI &amp; MCP Policy
            </Link>
            ).
          </li>
          <li>
            You can delete your account at any time in your account settings.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="5. Acceptable use">
        <p>Do not use the Demo to:</p>
        <LegalList>
          <li>Send spam, fraudulent or unwanted calendar invitations.</li>
          <li>
            Access other people&apos;s calendars or data without their
            permission.
          </li>
          <li>
            Attack, overload, scrape or disrupt the Demo or its infrastructure.
            If you find a security problem, please tell us privately (see
            Contact) instead of testing it on the Demo.
          </li>
          <li>Do anything illegal or that infringes others&apos; rights.</li>
        </LegalList>
        <p>
          We may block or delete any account at our discretion, for example to
          stop abuse.
        </p>
      </LegalSection>

      <LegalSection title="6. Your content">
        <p>
          You keep ownership of everything you put into the Demo. You allow us
          to store and process it only as far as needed to run the Demo for you
          and the teammates you share it with. The Scylla source code is
          governed by its repository, not by these terms.
        </p>
      </LegalSection>

      <LegalSection title="7. Third-party services">
        <p>
          The Demo depends on services we don&apos;t control, such as Google
          Calendar, Google Workspace, Google Meet, our hosting providers and any
          AI assistant you connect. Their own terms apply to your use of them,
          and we are not responsible for their availability or behavior.
        </p>
      </LegalSection>

      <LegalSection title="8. Disclaimer of warranties">
        <p className="uppercase">
          The Demo is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo;, without warranties of any kind, express or implied,
          including merchantability, fitness for a particular purpose,
          non-infringement, availability and accuracy, to the fullest extent
          permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitation of liability">
        <p>
          The Demo is a free service. To the fullest extent permitted by law,
          the maintainers and contributors are not liable for any damages
          arising from your use of, or inability to use, the Demo. This includes
          lost or corrupted data, missed, double-booked or wrongly booked
          meetings, invitations sent or not sent, changes made to your calendar,
          and actions taken by connected AI assistants.
        </p>
        <p>
          Nothing in these terms limits liability that cannot be limited by law,
          such as liability for intent or gross negligence, or for injury to
          life, body or health.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>
          We may update these terms. The date at the top shows the latest
          version. If you keep using the Demo after a change, the new terms
          apply.
        </p>
      </LegalSection>

      <LegalContact>
        Questions about these terms? Open an issue on GitHub:
      </LegalContact>
    </LegalPage>
  );
}
