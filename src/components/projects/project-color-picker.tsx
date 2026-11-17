"use client";

import * as React from "react";
import { cn } from "cn";

/** Project colors are stored data (the dot on every board), named for screen readers. */
export const PROJECT_COLORS = [
  { value: "#3b82f6", name: "Blue" },
  { value: "#10b981", name: "Green" },
  { value: "#8b5cf6", name: "Violet" },
  { value: "#f59e0b", name: "Amber" },
  { value: "#ef4444", name: "Red" },
  { value: "#ec4899", name: "Pink" },
  { value: "#6366f1", name: "Indigo" },
] as const;

export const DEFAULT_PROJECT_COLOR: string = PROJECT_COLORS[0].value;

type Props = {
  value: string;
  onChange: (color: string) => void;
  /** Id of the visible label that names the group. */
  labelledBy: string;
};

/** Radio group of swatches; arrow keys move the choice, one tab stop. */
export function ProjectColorPicker({ value, onChange, labelledBy }: Props) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const selected = PROJECT_COLORS.findIndex((c) => c.value === value);
  // A legacy color outside the presets still leaves the group reachable.
  const tabStop = selected === -1 ? 0 : selected;

  const move = (from: number, delta: number) => {
    const next = (from + delta + PROJECT_COLORS.length) % PROJECT_COLORS.length;
    onChange(PROJECT_COLORS[next].value);
    refs.current[next]?.focus();
  };

  const onKeyDown = (i: number) => (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(i, 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(i, -1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="flex flex-wrap items-center gap-1.5 py-1.5"
    >
      {PROJECT_COLORS.map((c, i) => {
        const checked = c.value === value;
        return (
          <button
            key={c.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={c.name}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(c.value)}
            onKeyDown={onKeyDown(i)}
            className={cn(
              "ring-offset-popover focus-visible:ring-ring/50 size-6 cursor-pointer rounded-full outline-none transition-shadow focus-visible:ring-[3px]",
              checked && "ring-ring ring-2 ring-offset-2 focus-visible:ring-2",
            )}
            style={{ backgroundColor: c.value }}
          />
        );
      })}
    </div>
  );
}
