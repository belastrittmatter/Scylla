"use client";

import * as React from "react";
import "./sign-in-showcase.css";

const SCENE_MS = 10_000; // must match the 10s animation-duration in the stylesheet

function Avatar({ color }: { color: string }) {
  return <span className="sis-av" style={{ background: color }} />;
}

function Team() {
  return (
    <span className="sis-avs">
      {["#60a5fa", "#f472b6", "#34d399", "#fbbf24"].map((c) => (
        <Avatar key={c} color={c} />
      ))}
    </span>
  );
}

function Caption({ before, after }: { before: string; after: string }) {
  return (
    <div className="sis-cap">
      <span className="sis-capA">{before}</span>
      <span className={`sis-capB sis-hl`}>{after}</span>
    </div>
  );
}

function Chat({
  question,
  steps,
  children,
}: {
  question: string;
  steps: string[];
  children: React.ReactNode;
}) {
  const stepClass = ["sis-step1", "sis-step2", "sis-step3"];
  return (
    <div className="sis-stage">
      <div className="sis-q">{question}</div>
      <div className="sis-who">
        <i />
        Scylla <span>via MCP</span>
      </div>
      {steps.map((step, i) => (
        <div key={step} className={`sis-step ${stepClass[i]}`}>
          <span className="sis-spin" />
          {step}
        </div>
      ))}
      <div className="sis-result">{children}</div>
    </div>
  );
}

function Book() {
  return (
    <>
      <Chat
        question="Find an hour with the design team this week and book a room."
        steps={[
          "Checked 4 calendars",
          "Everyone is free Thu 14:00",
          "Booked Room Alpha",
        ]}
      >
        <div className="sis-title">
          Design sync <b>Thu 14:00</b>
        </div>
        <div className="sis-meta">
          <Team />
          Room Alpha · invites sent
        </div>
      </Chat>
      <Caption before="Ask your AI assistant" after="On everyone's calendar" />
    </>
  );
}

function Move() {
  return (
    <>
      <Chat
        question="Push my 1:1 with Lena to tomorrow, same time."
        steps={[
          'Found "1:1 with Lena" on Wed',
          "Lena is free Thu 10:00",
          "Moved and notified Lena",
        ]}
      >
        <div className="sis-title">1:1 with Lena</div>
        <div className="sis-meta">
          <span className="sis-old">Wed 10:00</span>
          <span className="sis-newTime">→ Thu 10:00</span>
        </div>
      </Chat>
      <Caption
        before="Ask your AI assistant"
        after="Rescheduled, no back-and-forth"
      />
    </>
  );
}

function Briefing() {
  return (
    <>
      <Chat
        question="What's on my plate today?"
        steps={["Read today's calendar", "Checked your open tasks"]}
      >
        <div className="sis-agenda">
          <span className="sis-time">09:30</span>
          <span>Standup</span>
          <span className="sis-join">Join</span>
          <span className="sis-time">14:00</span>
          <span>Design sync</span>
          <span className="sis-join">Join</span>
          <span className="sis-time">16:00</span>
          <span>1:1 with Lena</span>
          <span />
        </div>
        <div className="sis-due">
          <span className="sis-box" />2 tasks due · Ship release notes, …
        </div>
      </Chat>
      <Caption before="Ask your AI assistant" after="Your day in one answer" />
    </>
  );
}

function GitHub() {
  return (
    <>
      <div className="sis-stage">
        <div className="sis-task">
          <div className="sis-title">
            Fix login redirect
            <span className={`sis-swap sis-status`}>
              <span className="sis-status1">In progress</span>
              <span className="sis-status2">In review</span>
              <span className="sis-status3">Done</span>
            </span>
          </div>
          <div className="sis-meta" style={{ marginTop: 7 }}>
            <Avatar color="#60a5fa" />
            Lena · Website relaunch
          </div>
        </div>
        <div className="sis-feed">
          <div className={`sis-ev sis-ev1`}>
            <b>Lena</b> created branch{" "}
            <code className="sis-mono">fix/login-redirect</code>
          </div>
          <div className={`sis-ev sis-ev2`}>
            <b>Lena</b> opened PR <code className="sis-mono">#318</code>
          </div>
          <div className={`sis-ev sis-ev3`}>
            <span className="sis-dot">✓</span>Checks passed
          </div>
          <div className={`sis-ev sis-ev4`}>
            <b>Sam</b> merged <code className="sis-mono">#318</code> into main
          </div>
        </div>
      </div>
      <div className="sis-cap">
        <span className="sis-gh1">Linked to GitHub</span>
        <span className={`sis-gh2 sis-hl`}>
          Board updated itself · team in sync
        </span>
      </div>
    </>
  );
}

const SCENES = [
  { title: "Book by asking", Scene: Book },
  { title: "Reschedule", Scene: Move },
  { title: "Daily briefing", Scene: Briefing },
  { title: "GitHub sync", Scene: GitHub },
];

/** Feature tour: story-style progress tabs over a looping vignette; each scene remounts so its CSS animation starts from 0. */
export function SignInShowcase({ className }: { className?: string }) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % SCENES.length),
      SCENE_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  const { Scene } = SCENES[index];
  // Theme colours are Tailwind classes so dark: applies; unlayered CSS would always win over them.
  return (
    <div
      aria-hidden
      className={`sis-root [--afg:#c2410c] [--blue:#2563eb] [--ok:#16a34a] [--violet:#7c3aed] dark:[--afg:#fdba74] dark:[--blue:#60a5fa] dark:[--ok:#22c55e] dark:[--violet:#a78bfa] ${className ?? ""}`}
    >
      <div className="mb-5 grid grid-cols-4 gap-3 text-[13px]">
        {SCENES.map((scene, i) => (
          <div
            key={scene.title}
            className={
              i === index
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }
          >
            <div className="bg-foreground/10 mb-2.5 h-0.5 overflow-hidden rounded-full">
              {i < index && <div className="bg-foreground/40 h-full" />}
              {i === index && (
                <div key={index} className="sis-fill bg-primary h-full" />
              )}
            </div>
            {scene.title}
          </div>
        ))}
      </div>
      <Scene key={index} />
    </div>
  );
}
