"use client";

import * as React from "react";
import { Check, Pause, Play } from "lucide-react";
import { Eyebrow } from "@/components/landing/primitives";
import { cn } from "@/lib/utils";

/**
 * Renders inside a `landing` scope (paper/ink/line/ember tokens, `font-code`).
 * Small text uses ink or ink-2 only: ink-3 is under 4.5:1 on paper in both themes.
 */

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

function Avatar({ className }: { className: string }) {
  return (
    <span
      className={cn(
        "border-surface -ml-1.5 size-3.5 shrink-0 rounded-full border-[1.5px] first:ml-0",
        className,
      )}
    />
  );
}

function Team() {
  return (
    <span className="flex">
      {["bg-ink", "bg-ink-2", "bg-ink-3", "bg-ember-soft"].map((c) => (
        <Avatar key={c} className={c} />
      ))}
    </span>
  );
}

function Done({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-line text-ink grid size-[13px] shrink-0 place-items-center rounded-full",
        className,
      )}
    >
      <Check className="size-2.5" strokeWidth={3} aria-hidden />
    </span>
  );
}

/** The only surface in the panel: a flat hairline stage that grows instead of clipping. */
const stage =
  "bg-surface border-line relative min-h-68 rounded-xl border p-4 text-xs";
/** Ember marks the one result each scene lands on. */
const result = "text-ember-deep";
const mono = "font-code text-[11px] tabular-nums";
const title = "flex items-center justify-between text-[13px] font-medium";
const meta = "text-ink-2 mt-1 flex items-center gap-1.5 text-xs";

function Caption({ at, children }: { at: number; children: string }) {
  return (
    <In at={at} className="text-ink-2 mt-3 text-xs font-medium">
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
          className="bg-ink/[0.06] slide-in-from-bottom-2 ml-auto w-fit max-w-[250px] rounded-[14px_14px_4px_14px] px-3 py-2 text-[13px] leading-snug"
        >
          {question}
        </In>
        <In
          at={1.2}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium"
        >
          <i className="bg-ink size-4 rounded-[5px]" />
          Scylla <span className={cn(mono, "text-ink-2")}>via MCP</span>
        </In>
        {steps.map((step, i) => (
          <In
            key={step}
            at={1.6 + i * 1.1}
            className="text-ink-2 slide-in-from-bottom-1 mt-1.5 ml-[23px] flex items-center gap-2 text-xs"
          >
            <span className="relative size-[13px] shrink-0">
              <span className="border-ink-3/60 absolute inset-0 animate-spin rounded-full border-[1.5px] border-t-transparent motion-reduce:hidden" />
              <In at={2.6 + i * 1.1} className="zoom-in-50 absolute inset-0">
                <Done />
              </In>
            </span>
            {step}
          </In>
        ))}
        <In
          at={2.6 + steps.length * 1.1}
          className="border-line slide-in-from-bottom-1 mt-3 ml-[23px] border-t border-dashed pt-3"
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
        <span className={cn(mono, result)}>Thu 14:00</span>
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
        <span className={cn(mono, "line-through")}>Wed 10:00</span>
        <span className={cn(mono, result)}>→ Thu 10:00</span>
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
      <div className="grid grid-cols-[40px_1fr_auto] items-center gap-x-2 gap-y-1.5 text-[13px]">
        {[
          ["09:30", "Standup", "Join"],
          ["14:00", "Design sync", "Join"],
          ["16:00", "1:1 with Lena", ""],
        ].map(([time, name, join]) => (
          <React.Fragment key={time}>
            <span className={cn(mono, "text-ink-2")}>{time}</span>
            <span>{name}</span>
            <span className="text-ink text-xs font-medium">{join}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="border-line text-ink-2 mt-2.5 flex items-center gap-1.5 border-t border-dashed pt-2.5 text-xs">
        <span className="border-ink-3 size-[11px] rounded-[3px] border-[1.5px]" />
        2 tasks due · Ship release notes, …
      </div>
    </Chat>
  );
}

function GitHub() {
  const pill =
    "bg-surface border-line col-start-1 row-start-1 w-[92px] rounded-full border py-px text-center font-code text-[11px]";
  const code = "border-line bg-paper rounded border px-1 font-code text-[11px]";
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
        <Done />
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
        <div className={title}>
          Fix login redirect
          <span className="grid justify-items-end">
            <span className={cn(pill, "text-ink-2")}>in progress</span>
            <In at={1.8} className={cn(pill, "text-ink")}>
              in review
            </In>
            <In at={5.4} className={cn(pill, result)}>
              done
            </In>
          </span>
        </div>
        <div className={cn(meta, "mt-1.5")}>
          <Avatar className="bg-ink-2" />
          Lena · Website relaunch
        </div>
        <div className="border-line mt-3 border-t border-dashed pt-4">
          <div className="border-line ml-1.5 border-l pl-3.5">
            {events.map(([at, text]) => (
              <In
                key={at}
                at={at}
                className="text-ink-2 slide-in-from-bottom-1 [&_b]:text-ink mt-3.5 flex items-center gap-1.5 first:mt-0.5 [&_b]:font-medium"
              >
                {text}
              </In>
            ))}
          </div>
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

/**
 * Feature tour: story-style progress tabs over a vignette; each scene remounts so its animations start from 0.
 *
 * The active progress bar's CSS animation is the clock: its `animationend` advances the tour. So autoplay
 * stops under reduced motion (no animation), while hidden below `lg` (display: none runs no animations),
 * and pauses with the play state on hover, focus, a background tab, or the Pause control (WCAG 2.2.2).
 */
export function SignInShowcase({ className }: { className?: string }) {
  const [index, setIndex] = React.useState(0);
  const [restart, setRestart] = React.useState(0);
  const [stopped, setStopped] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [tabHidden, setTabHidden] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setTabHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const paused = stopped || hovered || focused || tabHidden;
  const playState = { animationPlayState: paused ? "paused" : "running" };

  const { Scene } = SCENES[index];
  return (
    <div
      className={className}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      // Keyboard focus pauses; a mouse click is already covered by hover.
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <Eyebrow className="text-ink-2 text-[11px]">Product tour</Eyebrow>
        <button
          type="button"
          onClick={() => setStopped((value) => !value)}
          aria-label={stopped ? "Play product tour" : "Pause product tour"}
          className="font-code text-ink-2 hover:text-ink focus-visible:outline-ember -mr-2 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[11px] tracking-[0.12em] uppercase transition-colors focus-visible:outline-2"
        >
          {stopped ? (
            <Play className="size-3" aria-hidden />
          ) : (
            <Pause className="size-3" aria-hidden />
          )}
          {stopped ? "Play" : "Pause"}
        </button>
      </div>
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
              "focus-visible:outline-ember cursor-pointer rounded-sm text-left outline-offset-4 transition-colors focus-visible:outline-2",
              i === index
                ? "text-ink font-medium"
                : "text-ink-2 hover:text-ink",
            )}
          >
            <div className="bg-line mb-2.5 h-0.5 overflow-hidden rounded-full">
              {i < index && <div className="bg-ink-3 h-full" />}
              {i === index && (
                <div
                  key={`${index}-${restart}`}
                  className="animate-in slide-in-from-left-full bg-ember h-full ease-linear motion-reduce:animate-none"
                  style={{ animationDuration: `${SCENE_MS}ms`, ...playState }}
                  onAnimationEnd={(e) => {
                    if (e.target !== e.currentTarget) return;
                    setIndex((value) => (value + 1) % SCENES.length);
                  }}
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
        className={cn(
          "animate-in fade-in duration-500",
          paused && "[&_*]:[animation-play-state:paused]",
        )}
      >
        <Scene />
      </div>
    </div>
  );
}
