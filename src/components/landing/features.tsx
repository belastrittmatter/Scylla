import {
  CalendarRange,
  DoorOpen,
  FolderKanban,
  Link2,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import {
  CornerTicks,
  Section,
  SectionHeading,
} from "@/components/landing/primitives";

const FEATURES = [
  {
    icon: CalendarRange,
    title: "Team availability overlay",
    body: "Layer teammates' calendars and see shared free time at a glance, in your own timezone.",
  },
  {
    icon: DoorOpen,
    title: "Rooms with real constraints",
    body: "Meeting rooms come from your Google Workspace with capacity and location, and only free ones are offered.",
  },
  {
    icon: Link2,
    title: "Shareable booking links",
    body: "Send a link, guests pick an open slot, and the invite and Meet link are created for them.",
  },
  {
    icon: FolderKanban,
    title: "Meetings linked to projects",
    body: "Attach a booking to a project and it sits next to that project's tasks, so the context never lives in another tool.",
  },
  {
    icon: ListChecks,
    title: "Task boards with time tracking",
    body: "Kanban boards per project, threaded comments on every task and tracked time against each one.",
  },
  {
    icon: ShieldCheck,
    title: "Scoped agent access",
    body: "Agents sign in over OAuth and only get the scopes you consent to. Revoke a client and its access ends.",
  },
];

export function LandingFeatures() {
  return (
    <Section className="border-t">
      <SectionHeading
        center
        index="03"
        eyebrow="What's inside"
        title="A team calendar and a task board that finally talk to each other."
      />
      <div className="reveal relative mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        <CornerTicks />
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="group bg-surface p-7 transition-colors hover:bg-paper sm:p-8"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-ember-soft text-ember transition-transform group-hover:-rotate-6">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-6 font-medium text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
