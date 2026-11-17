import type { Metadata } from "next";
import Link from "next/link";
import { GITHUB_REPO_URL } from "@/lib/github-repo";
import { Bot, Shield, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "AI & MCP Policy | Scylla",
  description:
    "Learn how Scylla utilizes AI agents and Model Context Protocol (MCP) while maintaining strict data governance, user privacy, and zero unauthorized training.",
};

export default function AiPolicyPage() {
  return (
    <section>
      <div className="mx-auto w-full max-w-[1200px] border-x border-dashed border-line px-5 sm:px-10">
        <div className="py-20 sm:py-28">
          {/* Header */}
          <div className="max-w-[800px] mx-auto text-center mb-12 sm:mb-16">
            <span className="mb-5 inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 font-code text-xs text-ink-2">
              <Bot className="size-3.5 text-ember inline-block mr-1.5" />
              AI Governance
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight">
              AI &amp; MCP Policy
            </h1>
            <p className="mt-3 text-ink-2 text-sm sm:text-base">
              Last Updated: November 17, 2026 &bull; Model Context Protocol
              Standard
            </p>
          </div>

          {/* Content */}
          <div className="max-w-[840px] mx-auto text-ink-2 text-sm sm:text-base leading-relaxed space-y-10">
            <div className="p-6 rounded-2xl border border-line bg-surface space-y-3">
              <h2 className="text-ink font-medium text-lg flex items-center gap-2">
                <Shield className="size-5 text-ember" />
                Human-in-the-Loop &amp; Open Standards
              </h2>
              <p className="text-ink-2 leading-relaxed">
                Scylla integrates with the open Model Context Protocol (MCP) to
                allow authorized AI coding agents (such as Claude Desktop,
                Cursor, and Windsurf) to assist you with scheduling, meeting
                prep, and task triage. Our policy ensures that you always
                maintain 100% control, ownership, and visibility over any action
                an AI assistant performs.
              </p>
              <p className="text-ink-2 leading-relaxed text-xs sm:text-sm pt-2 border-t border-line">
                For complete details regarding our data collection practices and
                user rights, please consult our{" "}
                <Link
                  href="/privacy"
                  className="text-ember underline hover:text-ember-deep"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/terms"
                  className="text-ember underline hover:text-ember-deep"
                >
                  Terms of Service
                </Link>
                .
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight">
                1. Zero Unauthorized Model Training
              </h2>
              <p>
                We do <strong>NOT</strong> use your private workspace data,
                Kanban tasks, comments, or connected Google Calendar events to
                train public or foundational artificial intelligence models.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight">
                2. Explicit Authorization for Agent Actions
              </h2>
              <p>
                AI assistants access Scylla tools exclusively via authenticated
                MCP server tokens generated in your user settings. You can
                revoke, rotate, or restrict an agent token&apos;s permissions
                (e.g., read-only vs. read-write) at any time.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight">
                3. Google Calendar API Isolation
              </h2>
              <p>
                Data received from Google APIs (such as meeting schedules and
                participant emails) is handled in strict compliance with the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ember underline hover:text-ember-deep"
                >
                  Google API Services User Data Policy
                </a>
                . AI agents operating via Scylla cannot bypass calendar access
                boundaries or access private calendars without explicit user
                consent.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-ink tracking-tight">
                4. Questions &amp; Support
              </h2>
              <p>
                For questions regarding our AI policy or MCP implementation,
                please open an issue on GitHub:
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
