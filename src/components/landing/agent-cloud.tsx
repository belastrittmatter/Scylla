import {
  siClaude,
  siClaudecode,
  siCline,
  siCursor,
  siGithubcopilot,
  siGooglegemini,
  siJetbrains,
  siMistralai,
  siPerplexity,
  siRaycast,
  siWarp,
  siWindsurf,
  siZedindustries,
  type SimpleIcon,
} from "simple-icons";
import { CornerTicks } from "@/components/landing/primitives";

// Only clients with a published logo; OpenAI's mark isn't in simple-icons.
const AGENTS: Array<[string, SimpleIcon]> = [
  ["Claude", siClaude],
  ["Claude Code", siClaudecode],
  ["Gemini", siGooglegemini],
  ["GitHub Copilot", siGithubcopilot],
  ["Cursor", siCursor],
  ["Windsurf", siWindsurf],
  ["Cline", siCline],
  ["Zed", siZedindustries],
  ["JetBrains AI", siJetbrains],
  ["Warp", siWarp],
  ["Raycast", siRaycast],
  ["Perplexity", siPerplexity],
  ["Le Chat", siMistralai],
];

function Chips({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      className="flex shrink-0 items-center gap-3 pr-3"
      aria-hidden={hidden || undefined}
    >
      {AGENTS.map(([name, icon]) => (
        <li
          key={name}
          className="flex h-11 items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-sm whitespace-nowrap text-ink-2"
        >
          {/* currentColor keeps black marks (Cursor, Copilot) visible in dark mode */}
          <svg
            viewBox="0 0 24 24"
            className="size-4 shrink-0"
            aria-hidden="true"
          >
            <path d={icon.path} fill="currentColor" />
          </svg>
          {name}
        </li>
      ))}
    </ul>
  );
}

/** Logo strip of MCP clients; pauses on hover, static under reduced motion. */
export function LandingAgentCloud() {
  return (
    <section aria-label="Supported AI assistants">
      <div className="mx-auto max-w-[1200px] border-x border-dashed border-line px-5 pt-20 pb-6 sm:px-10 sm:pt-24">
        <div className="text-center">
          <h2 className="text-xl font-medium tracking-[-0.01em] text-ink sm:text-2xl">
            Works with the assistants your team already uses
          </h2>
          <p className="mt-2 text-sm text-ink-2">
            One MCP server. Every client can plan, book and update tasks.
          </p>
        </div>
        <div className="relative mt-8 border border-line bg-paper py-6">
          <CornerTicks />
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="marquee flex w-max">
              <Chips />
              <Chips hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
