import {
  Check,
  CircleDashed,
  CircleDot,
  Eye,
  FolderKanban,
  MapPin,
  Users,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CornerTicks,
  Eyebrow,
  Section,
  SectionHeading,
} from "@/components/landing/primitives";

/* ---------- shared frame ------------------------------------------------ */

function Panel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="reveal relative border border-line bg-surface">
      <CornerTicks />
      <figcaption className="flex items-center justify-between border-b border-line px-4 py-2.5 font-code text-xs text-ink-3">
        <span>
          <span className="text-ember">›</span> {label}
        </span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-line" />
          <span className="size-1.5 rounded-full bg-line" />
          <span className="size-1.5 rounded-full bg-line" />
        </span>
      </figcaption>
      <div className="p-4 sm:p-6">{children}</div>
    </figure>
  );
}

/* ---------- 01: everyone's day, one free hour --------------------------- */

const DAY_START = 9;
const DAY_HOURS = 8;
const pct = (h: number) => `${((h - DAY_START) / DAY_HOURS) * 100}%`;
const span = (from: number, to: number) => ({
  left: pct(from),
  width: `${((to - from) / DAY_HOURS) * 100}%`,
});

const ROWS: Array<{
  name: string;
  meta: string;
  busy: Array<[number, number, string]>;
  offAfter?: number;
}> = [
  {
    name: "Mara",
    meta: "Berlin",
    busy: [
      [9, 10, "Standup"],
      [13, 14, "1:1"],
      [15.5, 17, "Interviews"],
    ],
  },
  {
    name: "Alex",
    meta: "Lisbon",
    busy: [
      [9.5, 11, "Planning"],
      [12, 13.5, "Lunch"],
    ],
  },
  {
    name: "Priya",
    meta: "Warsaw",
    busy: [
      [9, 9.5, ""],
      [11, 12.5, "Client call"],
    ],
    offAfter: 15.5,
  },
  {
    name: "Room",
    meta: "Focus · 6 seats",
    busy: [
      [10, 11.5, "Booked"],
      [16, 17, "Booked"],
    ],
  },
];

function AvailabilityVisual() {
  return (
    <Panel label="find_common_meeting_slots">
      <div className="grid grid-cols-[76px_1fr] gap-x-3 sm:grid-cols-[112px_1fr]">
        <span className="font-code text-[10px] text-ink-3">Thu 19</span>
        <div className="relative h-5 font-code text-[10px] text-ink-3">
          {[9, 11, 13, 15, 17].map((h) => (
            <span
              key={h}
              className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
              style={{ left: pct(h) }}
            >
              {String(h).padStart(2, "0")}
              <span className="hidden sm:inline">:00</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        {ROWS.map((row) => (
          <div
            key={row.name}
            className="grid grid-cols-[76px_1fr] gap-x-3 border-t border-line sm:grid-cols-[112px_1fr]"
          >
            <div className="flex h-12 flex-col justify-center">
              <span className="truncate text-sm text-ink">{row.name}</span>
              <span className="truncate font-code text-[10px] text-ink-3">
                {row.meta}
              </span>
            </div>
            <div className="relative h-12">
              {/* hour gridlines */}
              {Array.from({ length: DAY_HOURS - 1 }, (_, i) => (
                <span
                  key={i}
                  className="absolute inset-y-0 w-px bg-line/70"
                  style={{ left: pct(DAY_START + i + 1) }}
                />
              ))}
              {row.busy.map(([from, to, title]) => (
                <span
                  key={from}
                  className="absolute inset-y-2 truncate rounded-[4px] border border-ink/10 bg-ink/[0.07] px-1.5 pt-1 text-[10px] leading-tight text-ink-3"
                  style={span(from, to)}
                >
                  <span className="hidden sm:inline">{title}</span>
                </span>
              ))}
              {row.offAfter && (
                <span
                  className="absolute inset-y-2 rounded-[4px] bg-[repeating-linear-gradient(135deg,var(--line)_0_3px,transparent_3px_7px)]"
                  style={span(row.offAfter, DAY_START + DAY_HOURS)}
                />
              )}
            </div>
          </div>
        ))}

        {/* The hour that is free for every row */}
        <div className="pointer-events-none absolute inset-y-0 right-0 left-[88px] sm:left-[124px]">
          <span
            className="absolute inset-y-0 rounded-md border-2 border-ember bg-ember/10"
            style={span(14, 15)}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 font-code text-[10px] text-ink-3">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] border border-ink/10 bg-ink/[0.07]" />
          Busy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] bg-[repeating-linear-gradient(135deg,var(--ink-3)_0_1px,transparent_1px_3px)]" />
          After hours
        </span>
        <span className="flex items-center gap-1.5 text-ember">
          <span className="size-2.5 rounded-[2px] border-2 border-ember" />
          Free for everyone · 14:00 – 15:00
        </span>
      </div>
    </Panel>
  );
}

/* ---------- 02: one prompt, resolved and booked ------------------------- */

const TRACE = [
  ["get_team", "Mobile team → Mara, Alex, Priya"],
  ["find_common_meeting_slots", "Thu 14:00 free for all"],
  ["list_meeting_rooms", "Focus Room fits 4"],
  ["book_meeting", "done"],
];

function BookingVisual() {
  return (
    <Panel label="claude · scylla mcp">
      <div className="ml-auto max-w-[340px] rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-sm leading-relaxed text-paper">
        Book an hour with my mobile team on Thursday for the app review. We need
        a room.
      </div>

      <ol className="mt-5 space-y-1.5 font-code text-[11px]">
        {TRACE.map(([tool, result]) => (
          <li key={tool} className="flex items-center gap-2 text-ink-3">
            <Check className="size-3 shrink-0 text-ember" aria-hidden="true" />
            <span className="shrink-0 text-ink-2">{tool}</span>
            <span className="min-w-0 truncate">→ {result}</span>
          </li>
        ))}
      </ol>

      <div className="relative mt-5 max-w-[380px] rounded-xl border border-line bg-paper">
        <div className="p-5">
          <p className="font-code text-[10px] tracking-[0.12em] text-ember uppercase">
            Confirmed
          </p>
          <p className="mt-2 text-lg font-medium text-ink">Mobile app review</p>
          <p className="text-sm text-ink-2">Thu, Nov 19 · 14:00 – 15:00</p>
        </div>
        {/* Ticket perforation */}
        <div
          className="relative border-t border-dashed border-line"
          aria-hidden="true"
        >
          <span className="absolute -top-2 -left-2 size-4 rounded-full border border-line bg-surface [clip-path:inset(0_0_0_50%)]" />
          <span className="absolute -top-2 -right-2 size-4 rounded-full border border-line bg-surface [clip-path:inset(0_50%_0_0)]" />
        </div>
        <ul className="space-y-2.5 p-5 text-sm text-ink-2">
          <li className="flex items-center gap-3">
            <MapPin className="size-4 text-ink-3" aria-hidden="true" />
            Focus Room · 6 seats
          </li>
          <li className="flex items-center gap-3">
            <Video className="size-4 text-ink-3" aria-hidden="true" />
            <span className="font-code text-xs">
              meet.google.com/xqt-pnra-kdw
            </span>
          </li>
          <li className="flex items-center gap-3">
            <FolderKanban className="size-4 text-ink-3" aria-hidden="true" />
            Linked to <span className="text-ink">Mobile App v2</span>
          </li>
          <li className="flex items-center gap-3">
            <Users className="size-4 text-ink-3" aria-hidden="true" />3 invites
            sent
            <span className="ml-auto flex -space-x-1.5" aria-hidden="true">
              {["M", "A", "P"].map((i) => (
                <span
                  key={i}
                  className="flex size-6 items-center justify-center rounded-full border-2 border-paper bg-ember-soft font-code text-[10px] text-ember"
                >
                  {i}
                </span>
              ))}
            </span>
          </li>
        </ul>
      </div>
    </Panel>
  );
}

/* ---------- 03: the project holds both ---------------------------------- */

const MEETINGS = [
  {
    day: "Thu",
    date: "19",
    title: "Mobile app review",
    time: "14:00 · Focus Room",
    fresh: true,
  },
  {
    day: "Mon",
    date: "23",
    title: "Sprint planning",
    time: "10:00 · Google Meet",
  },
];

const TASKS = [
  {
    icon: CircleDot,
    status: "In progress",
    tone: "text-ember",
    title: "Pricing screen",
    who: "M",
  },
  {
    icon: Eye,
    status: "In review",
    tone: "text-ink-2",
    title: "Offline sync",
    who: "A",
  },
  {
    icon: CircleDashed,
    status: "To do",
    tone: "text-ink-3",
    title: "Store screenshots",
    who: "P",
  },
];

function ProjectVisual() {
  return (
    <Panel label="get_project">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-ember" />
          <span className="font-medium text-ink">Mobile App v2</span>
        </div>
        <span className="font-code text-[10px] text-ink-3">
          12 / 20 tasks done
        </span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full w-3/5 rounded-full bg-ember" />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-3 font-code text-[10px] tracking-[0.12em] text-ink-3 uppercase">
            Meetings
          </p>
          <ul className="space-y-2">
            {MEETINGS.map((m) => (
              <li
                key={m.title}
                className={cn(
                  "flex items-center gap-3 rounded-lg border bg-paper p-2.5",
                  m.fresh ? "border-ember/50" : "border-line",
                )}
              >
                <span className="flex w-10 shrink-0 flex-col items-center rounded-md bg-surface py-1 leading-none">
                  <span className="font-code text-[9px] text-ink-3 uppercase">
                    {m.day}
                  </span>
                  <span className="mt-0.5 text-base text-ink">{m.date}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">
                    {m.title}
                  </span>
                  <span className="block truncate font-code text-[10px] text-ink-3">
                    {m.time}
                  </span>
                </span>
                {m.fresh && (
                  <span className="ml-auto rounded-full bg-ember-soft px-2 py-0.5 font-code text-[9px] text-ember">
                    new
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-code text-[10px] tracking-[0.12em] text-ink-3 uppercase">
            Tasks
          </p>
          <ul className="divide-y divide-line rounded-lg border border-line bg-paper">
            {TASKS.map(({ icon: Icon, ...t }) => (
              <li
                key={t.title}
                className="flex items-center gap-2.5 px-3 py-2.5"
              >
                <Icon
                  className={cn("size-3.5 shrink-0", t.tone)}
                  aria-label={t.status}
                />
                <span className="truncate text-sm text-ink">{t.title}</span>
                <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-ember-soft font-code text-[9px] text-ember">
                  {t.who}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- section ----------------------------------------------------- */

const STEPS = [
  {
    title: "Find the hour that works",
    body: "Scylla lays everyone's Google Calendar, working hours and timezone side by side, plus the room. The orange hour is the one where nobody is busy.",
    visual: <AvailabilityVisual />,
  },
  {
    title: "Book it in one go",
    body: "Ask for a team, not a list of emails. Scylla resolves who is in it, finds the slot, picks a room that fits and sends the invites with a Meet link.",
    visual: <BookingVisual />,
  },
  {
    title: "Meetings and tasks, in one project",
    body: "Every booking can belong to a project, right next to its board. Open the project to see what's in progress and when the team meets about it, and let your agent file the follow-ups as tasks.",
    visual: <ProjectVisual />,
  },
];

export function LandingHowItWorks() {
  return (
    <Section id="how" className="border-t">
      <SectionHeading
        center
        index="01"
        eyebrow="How it works"
        title="Ask once. Scylla handles the rest."
        lede="Finding a time, booking a room and keeping the meeting tied to the work usually takes five tabs. This is what happens when you ask Scylla instead."
      />

      <ol className="mt-16 space-y-20 sm:mt-24 sm:space-y-28">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"
          >
            <div className={cn("reveal", i % 2 === 1 && "lg:order-2")}>
              <Eyebrow>{`Step 0${i + 1}`}</Eyebrow>
              <h3 className="mt-4 text-2xl font-medium tracking-[-0.02em] text-ink sm:text-[28px]">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[440px] text-pretty leading-relaxed text-ink-2">
                {step.body}
              </p>
            </div>
            <div className={cn("min-w-0", i % 2 === 1 && "lg:order-1")}>
              {step.visual}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
