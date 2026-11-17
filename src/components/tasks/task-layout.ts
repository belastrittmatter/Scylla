/**
 * Shared class strings for the task workspace, so every band (board, list,
 * filter chips, timeline toolbar, skeleton) reads along the same left edge.
 */

/** Horizontal workspace gutter: 16px on phones, 20px (the ViewHeader's) from sm up. */
export const WORKSPACE_GUTTER = "px-4 sm:px-5";

/** Name-pane / band inset that lands on the same edge as WORKSPACE_GUTTER. */
export const WORKSPACE_INSET = "pl-4 pr-2 sm:pl-5 sm:pr-3";

/** Mono uppercase label (list group headers, column heads, timeline bands). */
export const EYEBROW =
  "font-code text-[11px] uppercase tracking-[0.08em] text-muted-foreground";

/** Machine values (dates, counts, durations, timers): small mono, tabular figures. */
export const MONO_META = "font-code text-[11px] tabular-nums";
