import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Shield, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "AI & Model Context Protocol Policy | Scylla",
  description:
    "Learn how Scylla utilizes AI agents and Model Context Protocol (MCP) while maintaining strict data governance, user privacy, and zero unauthorized training.",
};

export default function AiPolicyPage() {
  return (
    <section className="section-bottom-border bg-[#09090b] relative z-1 overflow-hidden pt-10">
      <div className="container">
        <div className="border-container section-spacing-lg">
          {/* Header */}
          <div className="max-w-[800px] mx-auto text-center mb-12 sm:mb-16">
            <span className="badge-button mb-4 inline-block">
              <Bot className="size-3.5 text-orange-400 inline-block mr-1.5" />
              AI Governance
            </span>
            <h1 className="gradient-text text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
              AI &amp; MCP Protocol Policy
            </h1>
            <p className="mt-3 text-offWhite/60 text-sm sm:text-base">
              Last Updated: November 1, 2026 &bull; Model Context Protocol
              Standard
            </p>
          </div>

          {/* Content */}
          <div className="max-w-[840px] mx-auto text-offWhite/80 text-sm sm:text-base leading-relaxed space-y-10">
            <div className="p-6 rounded-2xl border border-white/10 bg-[#121215] space-y-3">
              <h2 className="text-offWhite font-semibold text-lg flex items-center gap-2">
                <Shield className="size-5 text-orange-400" />
                Human-in-the-Loop &amp; Open Standards
              </h2>
              <p className="text-offWhite/70 leading-relaxed">
                Scylla integrates with the open Model Context Protocol (MCP) to
                allow authorized AI coding agents (such as Claude Desktop,
                Cursor, and Windsurf) to assist you with scheduling, meeting
                prep, and task triage. Our policy ensures that you always
                maintain 100% control, ownership, and visibility over any action
                an AI assistant performs.
              </p>
              <p className="text-offWhite/70 leading-relaxed text-xs sm:text-sm pt-2 border-t border-white/5">
                For complete details regarding our data collection practices and
                user rights, please consult our{" "}
                <Link
                  href="/privacy"
                  className="text-orange-400 underline hover:text-orange-300"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/terms"
                  className="text-orange-400 underline hover:text-orange-300"
                >
                  Terms of Service
                </Link>
                .
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-offWhite tracking-tight">
                1. Zero Unauthorized Model Training
              </h2>
              <p>
                We do <strong>NOT</strong> use your private workspace data,
                Kanban tasks, comments, or connected Google Calendar events to
                train public or foundational artificial intelligence models.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-offWhite tracking-tight">
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
              <h2 className="text-xl sm:text-2xl font-semibold text-offWhite tracking-tight">
                3. Google Calendar API Isolation
              </h2>
              <p>
                Data received from Google APIs (such as meeting schedules and
                participant emails) is handled in strict compliance with the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 underline hover:text-orange-300"
                >
                  Google API Services User Data Policy
                </a>
                . AI agents operating via Scylla cannot bypass calendar access
                boundaries or access private calendars without explicit user
                consent.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-offWhite tracking-tight">
                4. Questions &amp; Support
              </h2>
              <p>
                For questions regarding our AI policy or MCP implementation,
                please contact our team at:
              </p>
              <div className="p-5 rounded-xl border border-white/10 bg-[#121215] flex items-center gap-3">
                <Mail className="size-5 text-orange-400" />
                <span className="text-offWhite font-mono text-sm">
                  ai-policy@scylla.app
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
