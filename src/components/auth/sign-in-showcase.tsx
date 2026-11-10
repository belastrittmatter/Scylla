"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const SCENE_MS = 6_000;
/** Vignette delays were authored for a 10s scene; scale them with SCENE_MS so nothing is clipped. */
const SCALE = SCENE_MS / 10_000;

/** One-shot tw-animate-css entrance starting `at` seconds into the scene; reduced motion shows the end state. */
function In({
  at,
  className,
  children,
}: {
  at: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "animate-in fade-in fill-mode-both block duration-300 motion-reduce:animate-none",
        className,
      )}
      style={{ animationDelay: `${(at * SCALE).toFixed(2)}s` }}
    >
      {children}
    </span>
  );
}

function Avatar({ color }: { color: string }) {
  return (
    <span
      className="border-card -ml-1.5 size-3.5 shrink-0 rounded-full border-[1.5px] first:ml-0"
      style={{ background: color }}
    />
  );
}

function Team() {
  return (
    <span className="flex">
      {["#60a5fa", "#f472b6", "#34d399", "#fbbf24"].map((c) => (
        <Avatar key={c} color={c} />
      ))}
    </span>
  );
}

const stage =
  "bg-muted/40 relative h-[262px] overflow-hidden rounded-xl border p-3.5 text-xs";
const accent = "text-orange-700 dark:text-orange-300";
const title = "flex items-center justify-between text-[13px] font-semibold";
const meta =
  "text-muted-foreground mt-1 flex items-center gap-1.5 text-[11.5px]";

function Caption({ at, children }: { at: number; children: string }) {
  return (
    <In at={at} className={cn("mt-2.5 text-xs font-medium", accent)}>
      {children}
    </In>
  );
}

function Chat({
  question,
  steps,
  caption,
  children,
}: {
  question: string;
  steps: string[];
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className={stage}>
        <In
          at={0.2}
          className="bg-foreground/[0.07] slide-in-from-bottom-2 ml-auto w-fit max-w-[250px] rounded-[14px_14px_4px_14px] px-3 py-2 text-[13px] leading-snug"
        >
          {question}
        </In>
        <In
          at={1.2}
          className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold"
        >
          <i className="bg-primary size-4 rounded-[5px]" />
          Scylla{" "}
          <span className="text-muted-foreground font-normal">via MCP</span>
        </In>
        {steps.map((step, i) => (
          <In
            key={step}
            at={1.6 + i * 1.1}
            className="text-muted-foreground slide-in-from-bottom-1 mt-1.5 ml-[23px] flex items-center gap-2 text-[12.5px]"
          >
            <span className="relative size-[13px] shrink-0">
              <span className="border-muted-foreground/50 absolute inset-0 animate-spin rounded-full border-[1.5px] border-t-transparent motion-reduce:hidden" />
              <In
                at={2.6 + i * 1.1}
                className="zoom-in-50 absolute -inset-px grid place-items-center rounded-full bg-green-600 text-[9px] font-bold text-white dark:bg-green-500"
              >
                ✓
              </In>
            </span>
            {step}
          </In>
        ))}
        <In
          at={2.6 + steps.length * 1.1}
          className="bg-card zoom-in-95 slide-in-from-bottom-2 before:bg-primary relative mt-3 ml-[23px] overflow-hidden rounded-lg border py-2.5 pr-3 pl-3.5 before:absolute before:inset-y-0 before:left-0 before:w-[3px]"
        >
          {children}
        </In>
      </div>
      <Caption at={3 + steps.length * 1.1}>{caption}</Caption>
    </>
  );
}

function Book() {
  return (
    <Chat
      question="Find an hour with the design team this week and book a room."
      steps={[
        "Checked 4 calendars",
        "Everyone is free Thu 14:00",
        "Booked Room Alpha",
      ]}
      caption="On everyone's calendar"
    >
      <div className={title}>
        Design sync
        <span className={cn("text-xs font-medium", accent)}>Thu 14:00</span>
      </div>
      <div className={meta}>
        <Team />
        Room Alpha · invites sent
      </div>
    </Chat>
  );
}

function Move() {
  return (
    <Chat
      question="Push my 1:1 with Lena to tomorrow, same time."
      steps={[
        'Found "1:1 with Lena" on Wed',
        "Lena is free Thu 10:00",
        "Moved and notified Lena",
      ]}
      caption="Rescheduled, no back-and-forth"
    >
      <div className={title}>1:1 with Lena</div>
      <div className={meta}>
        <span className="line-through">Wed 10:00</span>
        <span className={cn("font-medium", accent)}>→ Thu 10:00</span>
      </div>
    </Chat>
  );
}

function Briefing() {
  return (
    <Chat
      question="What's on my plate today?"
      steps={["Read today's calendar", "Checked your open tasks"]}
      caption="Your day in one answer"
    >
      <div className="grid grid-cols-[38px_1fr_auto] items-center gap-x-2 gap-y-1.5">
        {[
          ["09:30", "Standup", "Join"],
          ["14:00", "Design sync", "Join"],
          ["16:00", "1:1 with Lena", ""],
        ].map(([time, name, join]) => (
          <React.Fragment key={time}>
            <span className="text-muted-foreground text-[11px] tabular-nums">
              {time}
            </span>
            <span>{name}</span>
            <span className={cn("text-[10.5px]", accent)}>{join}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="text-muted-foreground mt-2 flex items-center gap-1.5 border-t border-dashed pt-2 text-[11.5px]">
        <span className="border-muted-foreground/60 size-[11px] rounded-[3px] border-[1.5px]" />
        2 tasks due · Ship release notes, …
      </div>
    </Chat>
  );
}

function GitHub() {
  const pill =
    "bg-card col-start-1 row-start-1 w-[76px] rounded-full border border-current py-px text-center text-[10.5px] font-medium";
  const code = "bg-border rounded px-1.5 font-mono text-[10.5px]";
  const events: [number, React.ReactNode][] = [
    [
      0.4,
      <>
        <b>Lena</b> created branch{" "}
        <code className={code}>fix/login-redirect</code>
      </>,
    ],
    [
      1.8,
      <>
        <b>Lena</b> opened PR <code className={code}>#318</code>
      </>,
    ],
    [
      3.6,
      <>
        <span className="grid size-[13px] place-items-center rounded-full bg-green-600 text-[8.5px] font-bold text-white dark:bg-green-500">
          ✓
        </span>
        Checks passed
      </>,
    ],
    [
      5.4,
      <>
        <b>Sam</b> merged <code className={code}>#318</code> into main
      </>,
    ],
  ];
  return (
    <>
      <div className={stage}>
        <div className="bg-card rounded-lg border px-3 py-2.5">
          <div className={title}>
            Fix login redirect
            <span className="grid justify-items-end">
              <span className={cn(pill, "text-blue-600 dark:text-blue-400")}>
                In progress
              </span>
              <In
                at={1.8}
                className={cn(pill, "text-violet-600 dark:text-violet-400")}
              >
                In review
              </In>
              <In
                at={5.4}
                className={cn(pill, "text-green-600 dark:text-green-500")}
              >
                Done
              </In>
            </span>
          </div>
          <div className={cn(meta, "mt-1.5")}>
            <Avatar color="#60a5fa" />
            Lena · Website relaunch
          </div>
        </div>
        <div className="mt-4 ml-1.5 border-l pl-3.5">
          {events.map(([at, text]) => (
            <In
              key={at}
              at={at}
              className="text-muted-foreground slide-in-from-bottom-1 [&_b]:text-foreground mt-3.5 flex items-center gap-1.5 first:mt-0.5 [&_b]:font-medium"
            >
              {text}
            </In>
          ))}
        </div>
      </div>
      <Caption at={6}>Board updated itself · team in sync</Caption>
    </>
  );
}

const SCENES = [
  { title: "Book by asking", Scene: Book },
  { title: "Reschedule", Scene: Move },
  { title: "Daily briefing", Scene: Briefing },
  { title: "GitHub sync", Scene: GitHub },
];

/** Feature tour: story-style progress tabs over a vignette; each scene remounts so its animations start from 0. */
export function SignInShowcase({ className }: { className?: string }) {
  const [index, setIndex] = React.useState(0);
  const [restart, setRestart] = React.useState(0);

  // Every selection or tick gives the scene a full autoplay cycle.
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(
      () => setIndex((i) => (i + 1) % SCENES.length),
      SCENE_MS,
    );
    return () => window.clearTimeout(id);
  }, [index, restart]);

  const { Scene } = SCENES[index];
  return (
    <div className={className}>
      <div className="mb-5 grid grid-cols-4 gap-3 text-[13px]">
        {SCENES.map((scene, i) => (
          <button
            type="button"
            key={scene.title}
            aria-pressed={i === index}
            onClick={() => {
              setIndex(i);
              setRestart((value) => value + 1);
            }}
            className={cn(
              "cursor-pointer text-left",
              i === index
                ? "text-foreground font-medium"
                : "text-muted-foreground",
            )}
          >
            <div className="bg-foreground/10 mb-2.5 h-0.5 overflow-hidden rounded-full">
              {i < index && <div className="bg-foreground/40 h-full" />}
              {i === index && (
                <div
                  key={`${index}-${restart}`}
                  className="animate-in slide-in-from-left-full bg-primary h-full ease-linear motion-reduce:animate-none"
                  style={{ animationDuration: `${SCENE_MS}ms` }}
                />
              )}
            </div>
            {scene.title}
          </button>
        ))}
      </div>
      <div
        aria-hidden
        key={`${index}-${restart}`}
        className="animate-in fade-in duration-500"
      >
        <Scene />
      </div>
    </div>
  );
}
