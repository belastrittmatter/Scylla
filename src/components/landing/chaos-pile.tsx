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

/**
 * Device tilt (deg) to screen-space gravity, corrected for landscape.
 * Uses the real gravity vector, not raw beta/gamma: an upright phone has two Euler
 * readings for one pose (beta 60/gamma -90 equals beta 120/gamma 90), and reading
 * gamma directly flips left and right between them.
 */
export function tiltToGravity(
  beta: number,
  gamma: number,
  screenAngle: number,
) {
  const rad = Math.PI / 180;
  // Gravity in portrait screen space (x right, y down).
  const px = Math.sin(gamma * rad) * Math.cos(beta * rad);
  const py = Math.sin(beta * rad);
  const [x, y] =
    screenAngle === 90
      ? [py, -px]
      : screenAngle === 180
        ? [-px, -py]
        : screenAngle === 270
          ? [-py, px]
          : [px, py];
  // Full strength from a 45° tilt.
  const scale = (v: number) =>
    Math.max(-1, Math.min(1, v / Math.SQRT1_2)) * 1.2;
  return { x: scale(x), y: scale(y) };
}
export function ChaosPile() {
  const boxRef = useRef<HTMLDivElement>(null);
  const startTilt = useRef<(() => void) | null>(null);
  const [askTilt, setAskTilt] = useState(false);
  // Bumped on width change: remounts the fragments and rebuilds the walls for the new size.
  const [run, setRun] = useState(0);

  useEffect(() => {
    let width = innerWidth;
    const onResize = () => {
      if (innerWidth === width) return; // mobile URL bar only changes height
      width = innerWidth;
      setRun((r) => r + 1);
    };
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let cleanup = () => {};
    let stopTilt = () => {};
    let stopMouse = () => {};
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
          Body,
        } = await import("matter-js");
        if (disposed) return; // unmounted while matter-js was loading
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
              friction: 0.8,
              frictionStatic: 1,
            },
          ),
        );
        // World, in box coordinates: a bin (floor at H, side walls) whose walls stop at the
        // card's top edge (ledge). On desktop, above that edge fragments can move anywhere
        // within the card's width, and ones dropped beside the box rest on top of the card.
        // Phones get a closed bin with a ceiling, since tilt can point gravity up.
        const fine = matchMedia("(pointer: fine)").matches;
        const rect = box.getBoundingClientRect();
        const card = box.closest("[data-pile-card]") ?? box;
        const cardRect = card.getBoundingClientRect();
        const ledge = fine ? cardRect.top - rect.top : 0;
        const minX = fine ? cardRect.left - rect.left : 0;
        const maxX = fine ? cardRect.right - rect.left : W;
        const T = 4000;
        const wall = { isStatic: true };
        const block = (x0: number, y0: number, x1: number, y1: number) =>
          Bodies.rectangle(
            (x0 + x1) / 2,
            (y0 + y1) / 2,
            x1 - x0,
            y1 - y0,
            wall,
          );
        Composite.add(engine.world, [
          ...bodies,
          block(-T, H, W + T, H + T), // floor
          block(-T, ledge, 0, H + T), // left of the box, up to the card edge
          block(W, ledge, W + T, H + T), // right of the box, up to the card edge
          block(minX - T, ledge - T, minX, ledge), // card edges, all the way up
          block(maxX, ledge - T, maxX + T, ledge),
          ...(fine ? [] : [block(-T, -T, W + T, 0)]), // phone ceiling
        ]);

        // Drag only with a precise pointer: matter's touch handlers block page scrolling.
        if (fine) {
          const mouse = Mouse.create(box);
          const handlers = mouse as unknown as Record<
            "mousemove" | "mousedown" | "mouseup" | "mousewheel",
            EventListener
          >;
          // Keep page scroll working over the pile: matter's wheel and touch handlers
          // call preventDefault, which also breaks touch scrolling on touchscreen laptops.
          box.removeEventListener("wheel", handlers.mousewheel);
          box.removeEventListener("touchmove", handlers.mousemove);
          box.removeEventListener("touchstart", handlers.mousedown);
          box.removeEventListener("touchend", handlers.mouseup);
          // Track the cursor outside the box too, so fragments can be dragged out and released anywhere.
          addEventListener("mousemove", handlers.mousemove);
          addEventListener("mouseup", handlers.mouseup);
          stopMouse = () => {
            removeEventListener("mousemove", handlers.mousemove);
            removeEventListener("mouseup", handlers.mouseup);
          };
          Composite.add(
            engine.world,
            MouseConstraint.create(engine, {
              mouse,
              constraint: { stiffness: 0.2, damping: 0.1 },
            }),
          );
          // Keep the drag target in open space so the cursor never pulls a fragment into a wall.
          Events.on(engine, "beforeUpdate", () => {
            const { position } = mouse;
            position.x = Math.max(minX, Math.min(maxX, position.x));
            const inBox = position.x >= 0 && position.x <= W;
            position.y = Math.min(inBox ? H : ledge, position.y);
          });
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
        // Backstop against tunnelling: push anything that slipped into a wall back out.
        // 2px slack: resting contacts sink slightly, correcting those would jitter.
        Events.on(engine, "afterUpdate", () => {
          for (const body of bodies) {
            const { min, max } = body.bounds;
            const inBox = body.position.x >= 0 && body.position.x <= W;
            const left = inBox && max.y > ledge + 2 ? 0 : minX;
            const right = inBox && max.y > ledge + 2 ? W : maxX;
            const floor = inBox ? H : ledge;
            const dx =
              min.x < left - 2
                ? left - min.x
                : max.x > right + 2
                  ? right - max.x
                  : 0;
            const dy = max.y > floor + 2 ? floor - max.y : 0;
            if (dx || dy) Body.translate(body, { x: dx, y: dy });
          }
        });

        // 120 physics steps/s stays smooth on 120 Hz screens; draw once per frame.
        const runner = Runner.create({ delta: 1000 / 120 });
        Events.on(runner, "afterTick", () => {
          bodies.forEach(({ position, angle }, i) => {
            const el = els[i];
            el.style.translate = `${position.x - sizes[i][0]}px ${position.y - sizes[i][1]}px`;
            el.style.rotate = `${angle}rad`;
          });
        });
        Runner.run(runner, engine);
        cleanup = () => {
          stopTilt();
          stopMouse();
          Runner.stop(runner);
          Engine.clear(engine);
        };
      },
      { threshold: 0.5 },
    );
    observer.observe(box);
    return () => {
      disposed = true;
      // A permission prompt still open must not attach tilt to this dead run.
      startTilt.current = null;
      observer.disconnect();
      cleanup();
    };
  }, [run]);

  async function enableTilt() {
    setAskTilt(false);
    if ((await orientationApi().requestPermission?.()) === "granted") {
      startTilt.current?.();
    }
  }

  return (
    <div>
      <p className="mt-1 font-code text-xs text-ink-3">
        <span className="hidden motion-safe:[@media(pointer:fine)]:inline">
          go on, drag them around
        </span>
        <span className="hidden motion-safe:[@media(pointer:coarse)]:inline">
          {askTilt ? "tap the pile, then tilt your phone" : "tilt your phone"}
        </span>
      </p>
      <div
        key={run}
        ref={boxRef}
        role="img"
        onClick={askTilt ? enableTilt : undefined}
        aria-label="Chat threads, calendar conflicts, room sheets, Meet links and tickets, all at once"
        className="relative z-10 mt-6 h-[380px] cursor-grab touch-pan-y [contain:layout] [overflow-anchor:none] select-none active:cursor-grabbing"
      >
        {FRAGMENTS.map(({ icon: Icon, text, x, y, deg, wide }) => (
          <div
            key={text}
            style={{ left: `${x}%`, top: `${y}%`, rotate: `${deg}deg` }}
            className={`absolute items-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2 text-xs whitespace-nowrap text-ink-2 motion-reduce:max-sm:whitespace-normal shadow-[0_8px_24px_-12px_rgb(0_0_0/0.18)] sm:text-sm ${wide ? "hidden sm:flex" : "flex"}`}
          >
            <Icon className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
