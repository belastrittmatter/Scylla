"use client";

import * as React from "react";
import { cn } from "cn";

/**
 * Settings building blocks shared by /settings and /account/settings.
 * Cloudflare-style: a quiet page header, sections introduced by a mono
 * eyebrow, and thin-bordered groups of hairline-divided label | control rows.
 */

export function SettingsPageHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="space-y-1 border-b border-border pb-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h1 className="min-w-0 flex-1 basis-40 text-xl font-semibold tracking-tight text-balance text-foreground">
          {title}
        </h1>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {description ? (
        <p className="text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}

type SectionTone = "default" | "destructive";

/** Mono uppercase section label with a small accent dot (mirrors the landing Eyebrow). */
export function SettingsEyebrow({
  id,
  tone = "default",
  children,
}: {
  id?: string;
  tone?: SectionTone;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className={cn(
        "flex items-center gap-2 font-mono text-xs font-medium tracking-[0.12em] uppercase",
        tone === "destructive" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          tone === "destructive" ? "bg-destructive" : "bg-primary",
        )}
      />
      {children}
    </h2>
  );
}

/**
 * One settings section. `framed` (default) wraps the children in a single
 * 1px-bordered group whose rows are divided by hairlines. Set `framed={false}`
 * when the children already draw their own panels (better-auth-ui cards).
 */
export function SettingsSection({
  eyebrow,
  description,
  tone = "default",
  framed = true,
  children,
}: {
  eyebrow: React.ReactNode;
  description?: React.ReactNode;
  tone?: SectionTone;
  framed?: boolean;
  children: React.ReactNode;
}) {
  const headingId = React.useId();

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="space-y-1">
        <SettingsEyebrow id={headingId} tone={tone}>
          {eyebrow}
        </SettingsEyebrow>
        {description ? (
          <p className="text-xs text-pretty text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {framed ? (
        <div
          className={cn(
            "divide-y divide-border rounded-lg border bg-card",
            tone === "destructive" ? "border-destructive/40" : "border-border",
          )}
        >
          {children}
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}

/**
 * A single setting: label and one line of help on the left, the control on the
 * right. Below `sm` the label stacks above the control unless `inline` is set
 * (used for small controls such as switches).
 */
export function SettingRow({
  label,
  labelId,
  htmlFor,
  description,
  descriptionId,
  inline = false,
  children,
  className,
}: {
  label: React.ReactNode;
  labelId?: string;
  htmlFor?: string;
  description?: React.ReactNode;
  descriptionId?: string;
  inline?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const labelClass = "block text-sm font-medium text-foreground";

  return (
    <div
      className={cn(
        "flex gap-x-6 gap-y-3 px-4 py-3.5 sm:px-5",
        inline
          ? "items-center justify-between"
          : "flex-col sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        {htmlFor ? (
          <label id={labelId} htmlFor={htmlFor} className={labelClass}>
            {label}
          </label>
        ) : (
          <p id={labelId} className={labelClass}>
            {label}
          </p>
        )}
        {description ? (
          <p
            id={descriptionId}
            className="text-xs text-pretty text-muted-foreground"
          >
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
}

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  /** Accessible name when the visible label alone is not enough. Must contain the visible text. */
  ariaLabel?: string;
}

/**
 * A single-choice segmented control: a hairline track with one raised chip for
 * the selected value. Exposed as a radiogroup with roving focus and arrow-key
 * movement, so it reads and behaves like a set of radio buttons.
 */
export function SegmentedControl<T extends string | number>({
  value,
  options,
  onValueChange,
  labelledBy,
  describedBy,
  mono = false,
  className,
}: {
  value: T | undefined;
  options: readonly SegmentedOption<T>[];
  onValueChange: (value: T) => void;
  labelledBy?: string;
  describedBy?: string;
  mono?: boolean;
  className?: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const focusIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const select = (index: number) => {
    const option = options[index];
    if (!option) return;
    refs.current[index]?.focus();
    if (option.value !== value) onValueChange(option.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = options.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = index === 0 ? last : index - 1;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = last;
    }
    if (next !== null) {
      event.preventDefault();
      select(next);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 rounded-md border border-border bg-muted/60 p-0.5",
        className,
      )}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={String(option.value)}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.ariaLabel}
            tabIndex={index === focusIndex ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-3.5 [&_svg]:shrink-0",
              checked
                ? "bg-background text-foreground ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
              mono && "font-mono",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
