import Link from "next/link";
import { GITHUB_REPO_URL } from "@/lib/github-repo";
import { CornerTicks, Eyebrow, Section } from "@/components/landing/primitives";

const RUN: Array<{ kind: "call" | "out" | "ok"; text: string }> = [
  { kind: "call", text: 'resolve_user "nick"' },
  { kind: "out", text: "nick.tran@team.dev · Member" },
  { kind: "call", text: "find_common_meeting_slots attendees=4" },
  { kind: "out", text: "3 slots · Thu 14:00 · Fri 10:30 · Fri 16:00" },
  { kind: "call", text: "book_meeting room=focus-room time=thu-14:00" },
  { kind: "ok", text: "Focus Room confirmed · invites sent" },
];

export function LandingIntegrations() {
  return (
    <Section className="border-t">
      <div className="reveal relative grid gap-px border border-line bg-line lg:grid-cols-2">
        <CornerTicks />

        <div className="flex flex-col justify-center bg-surface p-7 sm:p-12">
          <Eyebrow index="05">Model Context Protocol</Eyebrow>
          <h2 className="mt-5 text-balance text-[32px] leading-[1.1] font-medium tracking-[-0.025em] text-ink sm:text-[44px]">
            Plug Scylla into any MCP client.
          </h2>
          <p className="mt-5 max-w-[460px] leading-relaxed text-ink-2">
            Add one endpoint to Claude, Cursor, Windsurf, Codex or any other MCP
            client. Sign in once, and your assistant can read calendars, book
            rooms and update tasks with your permissions, not more.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              prefetch={false}
              href="/auth/sign-in"
              className="inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-paper transition-colors hover:bg-ember hover:text-white"
            >
              Connect an agent
            </Link>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-full border border-line px-6 text-sm font-medium text-ink transition-colors hover:bg-paper"
            >
              Read the setup guide
            </a>
          </div>
        </div>

        <div className="relative isolate flex items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f2531f_0%,#d9440f_100%)] p-5 sm:p-12">
          <div
            className="halftone absolute inset-0 -z-10 opacity-60"
            aria-hidden="true"
          />
          <div className="w-full max-w-[480px] rounded-xl border border-white/10 bg-[#141210] p-5 font-code text-[12px] leading-relaxed text-white/80 shadow-[0_30px_60px_-20px_rgb(60_15_0/0.6)] sm:text-[13px]">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 text-white/50">
              <span className="flex items-center gap-2 text-white">
                <span className="size-2 rounded-full bg-[#ff6433] motion-safe:animate-pulse" />
                scylla · mcp
              </span>
              <span>streamable-http</span>
            </div>
            <ol className="space-y-1.5">
              {RUN.map((line) => (
                <li
                  key={line.text}
                  className={
                    line.kind === "ok"
                      ? "text-[#7ee2a8]"
                      : line.kind === "out"
                        ? "pl-4 text-white/50"
                        : "text-white"
                  }
                >
                  {line.kind === "call" && (
                    <span className="text-[#ff8a63]">$ </span>
                  )}
                  {line.kind === "out" && "→ "}
                  {line.kind === "ok" && "✓ "}
                  {line.text}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Section>
  );
}
