import { CornerTicks } from "@/components/landing/primitives";

const STATS = [
  {
    value: "33",
    unit: "tools",
    label: "One MCP server",
    body: "Agents check availability, resolve names, book rooms and manage tasks through the standard Model Context Protocol.",
  },
  {
    value: "1",
    unit: "prompt",
    label: "From ask to invite",
    body: "Find the slot, reserve the room, create the Meet link and send invites, in a single request.",
  },
  {
    value: "0",
    unit: "migrations",
    label: "Your calendar, as is",
    body: "Scylla works on top of the Google Calendar your team already has. Nothing to import, nothing to keep in sync by hand.",
  },
];

export function LandingStatBand() {
  return (
    <section>
      <div className="mx-auto max-w-[1200px] border-x border-dashed border-line px-5 pt-14 pb-16 sm:px-10 sm:pb-20">
        <div className="reveal relative grid gap-px border border-line bg-line md:grid-cols-3">
          <CornerTicks />
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-surface p-7 sm:p-9">
              <p className="flex items-baseline gap-1.5">
                <span className="text-6xl leading-none font-normal tracking-[-0.04em] text-ink tabular-nums sm:text-7xl">
                  {stat.value}
                </span>
                <span className="font-code text-lg text-ember italic">
                  {stat.unit}
                </span>
              </p>
              <h3 className="mt-6 font-medium text-ink">{stat.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                {stat.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
