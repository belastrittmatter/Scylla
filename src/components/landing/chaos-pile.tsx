"use client";

import { useEffect, useRef, useState } from "react";
import {
  BellRing,
  CalendarX2,
  Clock,
  DoorClosed,
  FileSpreadsheet,
  Hash,
  Link2Off,
  MailX,
  MessageCircle,
  TicketX,
  Video,
} from "lucide-react";

// x/y in % of the box, deg = starting tilt; also the no-JS / reduced-motion layout.
// wide = desktop only, so phones keep enough room for the pile to actually fall.
const FRAGMENTS = [
  {
    icon: MessageCircle,
    text: "“does Thu 2pm work for everyone?”",
    x: 4,
    y: 2,
    deg: -2,
  },
  {
    icon: CalendarX2,
    text: "Mara is busy 14:00 – 15:00",
    x: 44,
    y: 14,
    deg: 2,
  },
  { icon: DoorClosed, text: "Room 3B is taken", x: 8, y: 24, deg: 1 },
  {
    icon: Hash,
    text: "12 unread in #mobile",
    x: 56,
    y: 32,
    deg: -4,
    wide: true,
  },
  { icon: Link2Off, text: "where's the Meet link?", x: 24, y: 42, deg: -3 },
  {
    icon: FileSpreadsheet,
    text: "rooms_v3_FINAL.xlsx",
    x: 2,
    y: 54,
    deg: 3,
    wide: true,
  },
  { icon: Clock, text: "9am… whose 9am?", x: 52, y: 52, deg: 4 },
  { icon: MailX, text: "Alex declined", x: 30, y: 64, deg: -1, wide: true },
  {
    icon: Video,
    text: "two different Meet links",
    x: 50,
    y: 74,
    deg: 2,
    wide: true,
  },
  {
    icon: BellRing,
    text: "Reminder: book a room",
    x: 6,
    y: 78,
    deg: -4,
    wide: true,
  },
  {
    icon: TicketX,
    text: "which ticket was this about?",
    x: 18,
    y: 88,
    deg: -1,
  },
];

/**
 * The "without Scylla" pile. Once scrolled into view the fragments fall into a heap
 * (matter-js, loaded lazily). Mouse users drag them; on phones, tilting moves gravity.
 */

// iOS only exposes motion data after a user-gesture permission prompt.
type OrientationPermission = { requestPermission?: () => Promise<string> };
const orientationApi = () =>
  (typeof DeviceOrientationEvent === "undefined"
    ? {}
    : DeviceOrientationEvent) as OrientationPermission;

/** Device tilt (deg) to screen-space gravity, corrected for landscape. */
export function tiltToGravity(
  beta: number,
  gamma: number,
  screenAngle: number,
) {
  const [x, y] =
    screenAngle === 90
      ? [beta, -gamma]
      : screenAngle === 180
        ? [-gamma, -beta]
        : screenAngle === 270
          ? [-beta, gamma]
          : [gamma, beta];
  const scale = (v: number) => Math.max(-1, Math.min(1, v / 45)) * 1.2;
  return { x: scale(x), y: scale(y) };
}
export function ChaosPile() {
  const boxRef = useRef<HTMLDivElement>(null);
  const startTilt = useRef<(() => void) | null>(null);
  const [askTilt, setAskTilt] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup = () => {};
    let stopTilt = () => {};
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const {
          Engine,
          Runner,
          Bodies,
          Composite,
          Mouse,
          MouseConstraint,
          Events,
          Sleeping,
        } = await import("matter-js");
        const W = box.clientWidth;
        const H = box.clientHeight;
        const els = ([...box.children] as HTMLElement[]).filter(
          (el) => el.offsetWidth > 0,
        );

        // Sleeping stops resting bodies from micro-jittering on real devices.
        const engine = Engine.create({
          gravity: { y: 1.2 },
          enableSleeping: true,
        });
        const bodies = els.map((el) =>
          Bodies.rectangle(
            el.offsetLeft + el.offsetWidth / 2,
            el.offsetTop + el.offsetHeight / 2,
            el.offsetWidth,
            el.offsetHeight,
            {
              angle: (parseFloat(el.style.rotate) * Math.PI) / 180,
              chamfer: { radius: 8 },
              restitution: 0.25,
              friction: 0.6,
            },
          ),
        );
        const wall = { isStatic: true };
        Composite.add(engine.world, [
          ...bodies,
          Bodies.rectangle(W / 2, H + 50, W * 2, 100, wall),
          Bodies.rectangle(W / 2, -50, W * 2, 100, wall),
          Bodies.rectangle(-50, H / 2, 100, H * 4, wall),
          Bodies.rectangle(W + 50, H / 2, 100, H * 4, wall),
        ]);

        // Drag only with a precise pointer: matter's touch handlers block page scrolling.
        if (matchMedia("(pointer: fine)").matches) {
          const mouse = Mouse.create(box);
          box.removeEventListener(
            "wheel",
            (mouse as unknown as { mousewheel: EventListener }).mousewheel,
          );
          Composite.add(
            engine.world,
            MouseConstraint.create(engine, {
              mouse,
              constraint: { stiffness: 0.2 },
            }),
          );
        } else {
          const onTilt = ({ beta, gamma }: DeviceOrientationEvent) => {
            if (beta === null || gamma === null) return;
            const g = tiltToGravity(
              beta,
              gamma,
              screen.orientation?.angle ?? 0,
            );
            if (
              Math.abs(g.x - engine.gravity.x) +
                Math.abs(g.y - engine.gravity.y) <
              0.05
            )
              return;
            engine.gravity.x = g.x;
            engine.gravity.y = g.y;
            bodies.forEach((b) => Sleeping.set(b, false));
          };
          startTilt.current = () =>
            addEventListener("deviceorientation", onTilt);
          stopTilt = () => removeEventListener("deviceorientation", onTilt);
          if (orientationApi().requestPermission) setAskTilt(true);
          else startTilt.current();
        }

        // Move with translate (compositor only) instead of left/top (layout every frame).
        const sizes = els.map((el) => [
          el.offsetWidth / 2,
          el.offsetHeight / 2,
        ]);
        els.forEach((el) => {
          el.style.left = "0";
          el.style.top = "0";
        });
        Events.on(engine, "afterUpdate", () => {
          bodies.forEach(({ position, angle }, i) => {
            const el = els[i];
            el.style.translate = `${position.x - sizes[i][0]}px ${position.y - sizes[i][1]}px`;
            el.style.rotate = `${angle}rad`;
          });
        });

        const runner = Runner.create();
        Runner.run(runner, engine);
        cleanup = () => {
          stopTilt();
          Runner.stop(runner);
          Engine.clear(engine);
        };
      },
      { threshold: 0.5 },
    );
    observer.observe(box);
    return () => {
      observer.disconnect();
      cleanup();
    };
  }, []);

  async function enableTilt() {
    setAskTilt(false);
    if ((await orientationApi().requestPermission?.()) === "granted") {
      startTilt.current?.();
    }
  }

  return (
    <div>
      <p className="mt-1 font-code text-xs text-ink-3">
        <span className="hidden [@media(pointer:fine)]:inline">
          go on, drag them around
        </span>
        <span className="hidden [@media(pointer:coarse)]:inline">
          {askTilt ? "tap the pile, then tilt your phone" : "tilt your phone"}
        </span>
      </p>
      <div
        ref={boxRef}
        role="img"
        onClick={askTilt ? enableTilt : undefined}
        aria-label="Chat threads, calendar conflicts, room sheets, Meet links and tickets, all at once"
        className="relative mt-6 h-[380px] cursor-grab touch-pan-y [contain:layout_paint] [overflow-anchor:none] select-none active:cursor-grabbing"
      >
        {FRAGMENTS.map(({ icon: Icon, text, x, y, deg, wide }) => (
          <div
            key={text}
            style={{ left: `${x}%`, top: `${y}%`, rotate: `${deg}deg` }}
            className={`absolute items-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2 text-xs whitespace-nowrap text-ink-2 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.18)] sm:text-sm ${wide ? "hidden sm:flex" : "flex"}`}
          >
            <Icon className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
