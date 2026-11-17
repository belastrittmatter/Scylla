import type { Metadata } from "next";
import Link from "next/link";
import { GITHUB_REPO_URL } from "@/lib/github-repo";
import { FileText, CheckCircle2, Scale, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Scylla - The AI-Powered Task & Calendar Workspace",
  description:
    "Review the Terms of Service governing your access and use of the Scylla task management and calendar scheduling platform.",
};

export default function TermsOfServicePage() {
  return (
    <section>
      <div className="mx-auto w-full max-w-[1200px] border-x border-dashed border-line px-5 sm:px-10">
        <div className="py-20 sm:py-28">
          {/* Header */}
          <div className="max-w-[800px] mx-auto text-center mb-12 sm:mb-16">
            <span className="mb-5 inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 font-code text-xs text-ink-2">
              <Scale className="size-3.5 text-ember inline-block mr-1.5" />
              Legal Terms
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-3 text-ink-2 text-sm sm:text-base">
              Last Updated: November 17, 2026 &bull; Effective Immediately
            </p>
          </div>

          {/* Terms Content Container */}
          <div className="max-w-[840px] mx-auto text-ink-2 text-sm sm:text-base leading-relaxed space-y-10">
            {/* Agreement Box */}
            <div className="p-6 rounded-2xl border border-line bg-surface space-y-3">
              <h2 className="text-ink font-medium text-lg flex items-center gap-2">
                <FileText className="size-5 text-ember" />
                Agreement to Terms
              </h2>
              <p className="text-ink-2 leading-relaxed">
                These Terms of Service (&ldquo;Terms&rdquo;) constitute a
                legally binding agreement between you (&ldquo;User&rdquo;,
                &ldquo;you&rdquo;) and Scylla (&ldquo;Scylla&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By
                creating an account, accessing our web application, integrating
                external calendars, or utilizing our Model Context Protocol
                (MCP) APIs, you agree to be bound by these Terms. If you do not
                agree to these Terms, you must not access or use the Service.
              </p>
              <p className="text-ink-2 leading-relaxed text-xs sm:text-sm pt-2 border-t border-line">
                Your use of the Service is also subject to our{" "}
                <Link
                  href="/privacy"
                  className="text-ember underline hover:text-ember-deep"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/ai-policy"
                  className="text-ember underline hover:text-ember-deep"
                >
                  AI &amp; MCP Policy
                </Link>
                , which describe how we handle user data and govern AI assistant
                capabilities.
              </p>
            </div>

            {/* Section 1: Services */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight">
                1. Description of Services
              </h2>
              <p>
                Scylla provides an intelligent, unified productivity workspace
                including:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-ink-2">
                <li>
                  Interactive Kanban boards, task timelines, sprint backlogs,
                  and milestone tracking.
                </li>
                <li>
                  Sub-second live deep-work session timers and team velocity
                  analytics.
                </li>
                <li>
                  Multi-person calendar scheduling, room availability detection,
                  and personalized booking links.
                </li>
                <li>
                  Synchronization with Google Calendar and Google Workspace
                  meeting rooms.
                </li>
                <li>
                  Standard Model Context Protocol (MCP) server endpoints
                  allowing authorized AI coding agents to interact with your
                  workspace.
                </li>
              </ul>
            </div>

            {/* Section 2: Account Registration */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight">
                2. Accounts &amp; Security
              </h2>
              <p>
                To access features of the Service, you must register an account
                using Google OAuth or authorized single sign-on credentials. You
                are responsible for safeguarding your credentials, API tokens,
                and MCP access keys. You agree to notify us immediately of any
                unauthorized use of your account.
              </p>
            </div>

            {/* Section 3: Google Calendar & Third-Party Services */}
            <div className="space-y-4 p-6 rounded-2xl border border-line bg-surface">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight flex items-center gap-2">
                <CheckCircle2 className="size-5 text-ember" />
                3. Third-Party Integrations &amp; Google Services
              </h2>
              <p className="text-ink-2">
                When you connect your Google Account or external calendar
                providers to Scylla, you authorize us to access, retrieve, and
                synchronize event availability and meeting data in accordance
                with our{" "}
                <Link
                  href="/privacy"
                  className="text-ember underline hover:text-ember-deep"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <p className="text-ink-2">
                Our integration with Google Calendar complies strictly with the
                Google API Services User Data Policy, including Limited Use
                restrictions. You may disconnect third-party services at any
                time from Scylla settings or through the respective third-party
                provider&apos;s security dashboard.
              </p>
            </div>

            {/* Section 4: Acceptable Use */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight">
                4. Acceptable Use Policy
              </h2>
              <p>You agree that you will not:</p>
              <ul className="list-disc pl-6 space-y-1.5 text-ink-2">
                <li>
                  Use the Service to transmit unsolicited commercial
                  communications (&ldquo;spam&rdquo;) or fraudulent calendar
                  invitations.
                </li>
                <li>
                  Attempt to probe, scan, or test the vulnerability of our
                  systems or breach security mechanisms.
                </li>
                <li>
                  Reverse engineer, decompile, or disassemble any portion of the
                  Service, except where permitted by applicable law.
                </li>
                <li>
                  Use the Service in violation of applicable laws, export
                  regulations, or third-party intellectual property rights.
                </li>
              </ul>
            </div>

            {/* Section 5: Intellectual Property */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight">
                5. Intellectual Property Rights
              </h2>
              <p>
                You retain full ownership of all task descriptions, meeting
                agendas, notes, and intellectual content you upload to Scylla.
                Scylla and its licensors retain all right, title, and interest
                in and to the platform, including our trademarks, logos, visual
                design, and proprietary software.
              </p>
            </div>

            {/* Section 6: Disclaimers & Limitation of Liability */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight">
                6. Disclaimers &amp; Limitation of Liability
              </h2>
              <p className="text-ink-2">
                THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
                AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
                OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, SCYLLA
                DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR
                A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-ink-2">
                IN NO EVENT SHALL SCYLLA BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR IN
                CONNECTION WITH YOUR USE OF THE SERVICE, CALENDAR
                SYNCHRONIZATION DELAYS, OR THIRD-PARTY SERVICE OUTAGES.
              </p>
            </div>

            {/* Section 7: Termination */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight">
                7. Termination
              </h2>
              <p>
                You may terminate your account at any time. We reserve the right
                to suspend or terminate your access to the Service if you
                violate these Terms or if required by law.
              </p>
            </div>

            {/* Section 8: Contact */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight">
                8. Contact Information
              </h2>
              <p>
                If you have questions regarding these Terms of Service, please
                open an issue on GitHub:
              </p>
              <div className="p-5 rounded-xl border border-line bg-surface flex items-center gap-3">
                <MessageSquare className="size-5 text-ember" />
                <a
                  href={`${GITHUB_REPO_URL}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink font-mono text-sm underline underline-offset-4 hover:text-ember"
                >
                  github.com/belastrittmatter/Scylla/issues
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
