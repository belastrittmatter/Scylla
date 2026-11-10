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

function KCard({
  title,
  prio,
  color,
  col,
  top,
}: {
  title: string;
  prio: string;
  color: string;
  col: number;
  top: number;
}) {
  return (
    <div
      className="sis-kcard"
      style={{ left: `calc(14px + ${col} * ((100% - 40px) / 3 + 6px))`, top }}
    >
      {title}
      <div className="sis-row">
        <span className="sis-prio">{prio}</span>
        <Avatar color={color} />
      </div>
    </div>
  );
}

function Board() {
  return (
    <>
      <div className="sis-stage">
        <div className="sis-cols">
          {[
            ["To do", "var(--faint)"],
            ["In progress", "var(--blue)"],
            ["Done", "var(--ok)"],
          ].map(([name, color]) => (
            <div key={name} className="sis-col">
              <h4>
                <i style={{ background: color }} />
                {name}
              </h4>
            </div>
          ))}
        </div>
        <KCard
          title="Update API docs"
          prio="Low"
          color="#34d399"
          col={0}
          top={98}
        />
        <KCard
          title="Fix flaky test"
          prio="Medium"
          color="#fbbf24"
          col={0}
          top={156}
        />
        <KCard
          title="Search endpoint"
          prio="Medium"
          color="#60a5fa"
          col={1}
          top={98}
        />
        <KCard
          title="Onboarding flow"
          prio="High"
          color="#a78bfa"
          col={2}
          top={98}
        />
        <div className={`sis-kcard sis-mover`}>
          <span className="sis-box" />
          <span>Changelog</span>
          <div className="sis-row">
            <span className={`sis-prio sis-prioHigh`}>High</span>
            <Avatar color="#f472b6" />
          </div>
        </div>
      </div>
      <div className="sis-cap">
        <span className="sis-board1">Your team&apos;s board</span>
        <span className={`sis-board2 sis-hl`}>
          Lena moved it to In progress
        </span>
        <span className={`sis-board3 sis-hl`}>
          Done · everyone sees it live
        </span>
      </div>
    </>
  );
}

function Project() {
  return (
    <>
      <div className="sis-stage">
        <div className="sis-projHead">
          Website relaunch{" "}
          <span className="sis-pill" style={{ color: "var(--ok)" }}>
            Active
          </span>
        </div>
        <div className="sis-progress">
          <span className="sis-bar">
            <i />
          </span>
          <span className={`sis-swap sis-count`}>
            <span className="sis-count1">4/7</span>
            <span className="sis-count2">5/7</span>
          </span>
        </div>
        <div className="sis-section">Meetings</div>
        <div className={`sis-item sis-added`}>
          <span className="sis-cal" />
          Design review <span className="sis-newBadge">New</span>
          <span className="sis-end">Thu 14:00</span>
        </div>
        <div className="sis-item">
          <span className={`sis-cal sis-calPast`} />
          Kickoff
          <span className="sis-end">Mon 10:00</span>
        </div>
        <div className="sis-section">Tasks</div>
        <div className={`sis-item sis-done`}>
          <span className="sis-box" />
          <span className="sis-label">Ship hero section</span>
          <span className="sis-end">
            <Avatar color="#f472b6" />
          </span>
        </div>
        <div className="sis-item">
          <span className="sis-box" />
          Migrate blog posts
          <span className="sis-end">
            <Avatar color="#60a5fa" />
          </span>
        </div>
      </div>
      <div className="sis-cap">
        <span className="sis-proj1">One project, one place</span>
        <span className={`sis-proj2 sis-hl`}>
          Meetings and tasks stay with the project
        </span>
      </div>
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

const SCENES = [Book, Board, Move, Project, Briefing, GitHub];

/** Decorative loop of product vignettes; each scene remounts so its CSS animation starts from 0. */
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

  const Scene = SCENES[index];
  // Theme colours are Tailwind classes so dark: applies; unlayered CSS would always win over them.
  return (
    <div
      aria-hidden
      className={`sis-root [--afg:#c2410c] [--blue:#2563eb] [--lift:0_10px_24px_rgb(0_0_0/0.1)] [--ok:#16a34a] [--violet:#7c3aed] dark:[--afg:#fdba74] dark:[--blue:#60a5fa] dark:[--lift:0_10px_24px_rgb(0_0_0/0.55)] dark:[--ok:#22c55e] dark:[--violet:#a78bfa] ${className ?? ""}`}
    >
      <Scene key={index} />
    </div>
  );
}
