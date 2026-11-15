"use client";

import * as React from "react";
import DottedMap from "dotted-map";

const CITIES = [
  { name: "San Francisco", lat: 37.77, lng: -122.42 },
  { name: "London", lat: 51.5, lng: -0.13 },
  { name: "Singapore", lat: 1.35, lng: 103.82 },
  { name: "Ho Chi Minh", lat: 10.82, lng: 106.63 },
];

/**
 * "Region: your team" — a dotted world map (Cloudflare's iconic block,
 * Scylla-flavored). Dots draw in left-to-right on scroll, city pins mark
 * where distributed teams live, and dots near the cursor light up orange.
 * Pure canvas — no hydration surface.
 */
export function LandingRegion() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    let progress = reduced ? 1 : 0;
    let targetProgress = reduced ? 1 : 0;
    const pointer = { x: -9999, y: -9999, active: false };

    let INK = document.documentElement.classList.contains("dark")
      ? "122, 122, 132"
      : "39, 39, 42";
    const ACCENT = "234, 88, 12";
    const themeObserver = new MutationObserver(() => {
      INK = document.documentElement.classList.contains("dark")
        ? "122, 122, 132"
        : "39, 39, 42";
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const map = new DottedMap({ height: 60, grid: "diagonal" });
    for (const city of CITIES) {
      map.addPin({
        lat: city.lat,
        lng: city.lng,
        svgOptions: { color: ACCENT, radius: 0.9 },
      });
    }
    const points = map.getPoints();
    const minX = 1;
    const maxX = 98.5;
    const minY = 3;
    const maxY = 42; // crop empty southern ocean
    const dots = points.map(
      (p: { x: number; y: number; svgOptions?: unknown }) => ({
        x01: (p.x - minX) / (maxX - minX),
        y01: (p.y - minY) / (maxY - minY),
        pin: Boolean(p.svgOptions),
      }),
    );

    let canvasDots: Array<{ x: number; y: number; pin: boolean }> = [];

    const layout = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const padX = width * 0.06;
      const padY = height * 0.1;
      const usableW = width - padX * 2;
      const usableH = height - padY * 2;
      canvasDots = dots.map((d) => ({
        x: padX + d.x01 * usableW,
        y: padY + d.y01 * usableH,
        pin: d.pin,
      }));
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) targetProgress = 1;
        }
      },
      { threshold: 0.3 },
    );
    io.observe(wrap);

    const ro = new ResizeObserver(() => layout());
    ro.observe(wrap);
    layout();

    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerleave", onLeave);

    const t0 = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      const t = (now - t0) / 1000;
      progress += (targetProgress - progress) * 0.05;

      ctx.clearRect(0, 0, width, height);
      const sweepX = reduced
        ? -9999
        : ((t * 0.06) % 1.3) * width - width * 0.15;

      for (const d of canvasDots) {
        // left-to-right draw-in
        if (d.x / width > progress) continue;

        let accent = 0;
        if (sweepX > -999 && Math.abs(d.x - sweepX) < 90) {
          accent = Math.max(accent, (1 - Math.abs(d.x - sweepX) / 90) * 0.6);
        }
        if (pointer.active) {
          const dist = Math.hypot(d.x - pointer.x, d.y - pointer.y);
          if (dist < 120) {
            accent = Math.max(accent, (1 - dist / 120) * 0.95);
          }
        }
        if (d.pin) accent = 1;

        const size = d.pin ? 3.2 : 1.6;
        if (accent > 0.02) {
          ctx.fillStyle = `rgba(${ACCENT}, ${Math.min(0.95, 0.35 + accent)})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, size * (1 + accent * 0.7), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${INK}, ${d.pin ? 0.9 : 0.55})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // City labels next to pins
      ctx.font = "500 11px system-ui, sans-serif";
      ctx.textBaseline = "middle";
      for (const city of CITIES) {
        const lng01 = (city.lng - -180) / 360;
        const x = width * 0.06 + lng01 * (width * 0.88);
        const latY = Math.asinh(Math.tan((city.lat * Math.PI) / 180));
        const lat01 =
          (Math.log(Math.tan((90 + city.lat) * (Math.PI / 360))) /
            (Math.PI / 180)) *
          -1;
        const y =
          height * 0.1 +
          ((lat01 - minY01()) / (maxY01() - minY01())) * (height * 0.8);
        ctx.fillStyle = "rgba(234, 88, 12, 0.95)";
        ctx.fillText(city.name, x + 9, y);
      }

      raf = requestAnimationFrame(frame);
    };

    // Web-Mercator y bounds matching the dotted map crop
    const minY01 = () => -0.72;
    const maxY01 = () => 0.75;

    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      themeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section className="relative" data-region="">
      <div className="container">
        <div className="border-container py-8 sm:py-10">
          <div
            className="max-w-[640px] mx-auto text-center mb-8 sm:mb-10"
            data-section-title=""
          >
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl !leading-[1.1] font-semibold -tracking-[0.02em] text-[#18181b] dark:text-[#fbfbfb]"
              data-title=""
            >
              Region: your team
            </h2>
            <p
              className="mt-4 text-[#52525b] dark:text-[#a1a1aa] text-sm sm:text-base"
              data-excerpt=""
            >
              Your people, your rooms, and your agents — on one map. Scylla
              schedules across every timezone your team works in.
            </p>
          </div>
          <div
            ref={wrapRef}
            className="relative h-[320px] sm:h-[400px] lg:h-[460px] rounded-[16px] border border-[#e4e4e7] bg-[var(--sl-surface)] dark:border-[#222227] overflow-hidden cursor-crosshair"
            data-globe-wrap=""
          >
            <canvas ref={canvasRef} className="block h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
