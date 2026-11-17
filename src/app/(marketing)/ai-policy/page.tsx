import type { Metadata } from "next";
import { Bot } from "lucide-react";
import {
  DemoNotice,
  LegalContact,
  LegalLinks,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/landing/legal";

export const metadata: Metadata = {
  title: "AI & MCP Policy | Scylla",
  description:
    "How AI assistants connect to the hosted Scylla demo over the Model Context Protocol, what they can do, and who is responsible for their actions.",
};

export default function AiPolicyPage() {
  return (
    <LegalPage icon={Bot} badge="Legal" title="AI & MCP Policy">
      <DemoNotice>
        <LegalLinks
          links={[
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms of Service" },
          ]}
        />
      </DemoNotice>

      <LegalSection title="1. How assistants connect">
        <p>
          Scylla runs a Model Context Protocol (MCP) server. To connect an
          assistant such as Claude, Cursor or Codex, you add the server to the
          assistant, sign in to Scylla and approve a consent screen. The consent
          screen lists the permissions the assistant asks for, such as reading
          your calendar, booking meetings and rooms, or creating, changing and
          deleting tasks, projects and teams. The assistant only gets the
          permissions you approve.
        </p>
        <p>
          You can see and revoke connected assistants at any time in your
          account settings. Revoking ends that assistant&apos;s access.
        </p>
      </LegalSection>

      <LegalSection title="2. What assistants can do">
        <LegalList>
          <li>
            Every action runs as you, with your permissions. An assistant
            can&apos;t see calendars, teams or projects that you can&apos;t see.
          </li>
          <li>
            Within the permissions you granted, an assistant can act without
            asking you again. That includes sending real calendar invitations to
            real people and permanently deleting tasks or projects, if you
            granted those permissions.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. You are responsible for your assistant">
        <p>
          AI assistants make mistakes. They can misread a request, pick the
          wrong time or people, or change the wrong item. Actions an assistant
          takes through your account count as your actions. Grant only the
          permissions you need, and check what your assistant did. The Demo
          comes with no guarantee that any assistant action is correct, and we
          are not liable for its results (see the Terms of Service).
        </p>
      </LegalSection>

      <LegalSection title="4. AI models and your data">
        <LegalList>
          <li>
            Scylla does not run AI models itself and does not send your data to
            AI providers on its own.
          </li>
          <li>
            When you connect an assistant, the data it requests is sent to that
            assistant. From there, the assistant provider&apos;s terms and
            privacy policy apply.
          </li>
          <li>
            We do not use your data, including Google user data, to train AI or
            ML models.
          </li>
        </LegalList>
      </LegalSection>

      <LegalContact>
        Questions about this policy or the MCP server? Open an issue on GitHub:
      </LegalContact>
    </LegalPage>
  );
}
