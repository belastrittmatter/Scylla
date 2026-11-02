import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, Database, RefreshCw, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Scylla - The AI-Powered Task & Calendar Workspace",
  description:
    "Learn how Scylla collects, uses, protects, and handles your data, including our compliance with Google API Services User Data Policy.",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="section-bottom-border bg-[#09090b] relative z-1 overflow-hidden pt-10">
      <div className="container">
        <div className="border-container section-spacing-lg">
          {/* Header */}
          <div className="max-w-[800px] mx-auto text-center mb-12 sm:mb-16">
            <span className="badge-button mb-4 inline-block">
              <Shield className="size-3.5 text-orange-400 inline-block mr-1.5" />
              Legal &amp; Trust
            </span>
            <h1 className="gradient-text text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-3 text-offWhite/60 text-sm sm:text-base">
              Last Updated: November 1, 2026 &bull; Effective Immediately
            </p>
          </div>

          {/* Policy Content Container */}
          <div className="max-w-[840px] mx-auto text-offWhite/80 text-sm sm:text-base leading-relaxed space-y-10">
            {/* Overview Box */}
            <div className="p-6 rounded-2xl border border-white/10 bg-[#121215] space-y-3">
              <h2 className="text-offWhite font-semibold text-lg flex items-center gap-2">
                <Lock className="size-5 text-orange-400" />
                Commitment to User Privacy
              </h2>
              <p className="text-offWhite/70 leading-relaxed">
                At Scylla (&ldquo;Scylla&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), we take your privacy and data security seriously. This Privacy Policy describes how we collect, use, store, and disclose information when you access or use our productivity platform, task Kanban boards, calendar synchronization services, and Model Context Protocol (MCP) integrations (collectively, the &ldquo;Service&rdquo;).
              </p>
            </div>

            {/* Section 1 */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-offWhite tracking-tight">
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us, as well as information collected automatically when you use our Service:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-offWhite/70">
                <li>
                  <strong className="text-offWhite">Account Information:</strong> When you register or sign in via Google OAuth or email, we collect your name, email address, profile picture, and organization details.
                </li>
                <li>
                  <strong className="text-offWhite">Task &amp; Workspace Data:</strong> Kanban task titles, descriptions, due dates, priority tags, time-tracking logs, comments, and project associations you create in Scylla.
                </li>
                <li>
                  <strong className="text-offWhite">Connected Calendar Data:</strong> Calendar IDs, event titles, scheduled timestamps, attendees, conference call URLs, and availability status necessary to detect schedule conflicts and book meetings.
                </li>
              </ul>
            </div>

            {/* Section 2: Google User Data Disclosures (MANDATORY FOR GOOGLE VERIFICATION) */}
            <div className="space-y-4 p-6 rounded-2xl border border-orange-500/30 bg-orange-500/[0.04]">
              <h2 className="text-xl sm:text-2xl font-semibold text-offWhite tracking-tight flex items-center gap-2">
                <RefreshCw className="size-5 text-orange-400" />
                2. Google Calendar API &amp; User Data Policy Compliance
              </h2>
              <p>
                Scylla connects to Google APIs (including Google Calendar API) to provide automated multi-person schedule comparison and bi-directional event synchronization.
              </p>
              <div className="space-y-3 text-offWhite/80">
                <p>
                  <strong className="text-offWhite">How We Use Google Data:</strong> We access your Google Calendar solely to calculate mutual free/busy times with your teammates, synchronize scheduled tasks with your calendar timeline, and create confirmed event invites on your behalf.
                </p>
                <p>
                  <strong className="text-offWhite">Google API Limited Use Disclosure:</strong> Scylla&apos;s use and transfer of information received from Google APIs to any other app will strictly adhere to the{" "}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-400 underline hover:text-orange-300"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including the Limited Use requirements.
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-offWhite/70">
                  <li>We do <strong>NOT</strong> sell your Google user data to third parties.</li>
                  <li>We do <strong>NOT</strong> use or transfer Google user data for serving advertisements, including personalized, retargeted, or interest-based advertising.</li>
                  <li>We do <strong>NOT</strong> use Google user data to train generalized AI/ML models without your explicit affirmative consent.</li>
                  <li>Human access to your calendar data is strictly prohibited unless required to resolve security incidents, comply with applicable law, or with your express permission for technical support.</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-offWhite tracking-tight">
                3. How We Use Your Information
              </h2>
              <p>We use the collected information for the following specific purposes:</p>
              <ul className="list-disc pl-6 space-y-2 text-offWhite/70">
                <li>To provide, maintain, and optimize our core task management, visual time-blocking, and calendar scheduling platform.</li>
                <li>To synchronize events bidirectionally with Google Calendar, Microsoft Outlook, and connected workspace tools.</li>
                <li>To enable Model Context Protocol (MCP) server endpoints allowing authorized AI coding assistants (such as Claude Desktop and Cursor) to schedule meetings and manage backlog items at your request.</li>
                <li>To detect, prevent, and address technical issues, security vulnerabilities, or unauthorized activity.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-offWhite tracking-tight">
                4. Data Storage, Security &amp; Retention
              </h2>
              <p>
                We implement enterprise-grade technical and organizational safeguards to protect your personal data, including TLS 1.3 encryption in transit and AES-256 encryption at rest.
              </p>
              <p>
                We retain your information only as long as your account is active or as necessary to provide you the Service. You can disconnect your Google Calendar integration at any time directly through Scylla settings or through your Google Account Security Permissions page.
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-offWhite tracking-tight">
                5. Your Data Rights &amp; Choices
              </h2>
              <p>Depending on your jurisdiction (including GDPR and CCPA/CPRA), you have the right to:</p>
              <ul className="list-disc pl-6 space-y-1.5 text-offWhite/70">
                <li>Access, download, or export a copy of your personal data.</li>
                <li>Correct inaccurate or incomplete account information.</li>
                <li>Request immediate and permanent deletion of your account and all associated workspace data.</li>
                <li>Revoke third-party authorization (including Google Calendar OAuth tokens) at any time.</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-offWhite tracking-tight">
                6. Contact Us
              </h2>
              <p>
                If you have questions, feedback, or requests regarding this Privacy Policy or your data, please contact our Data Protection Officer at:
              </p>
              <div className="p-5 rounded-xl border border-white/10 bg-[#121215] flex items-center gap-3">
                <Mail className="size-5 text-orange-400" />
                <span className="text-offWhite font-mono text-sm">
                  privacy@scylla.app
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
