/**
 * Fallback tints for when the API sends no color.
 *
 * Ember is reserved for the primary action, the active state and "now", so a
 * local event or project without its own color takes the neutral muted tone.
 * Synced Google events keep Google Calendar's own blue so they stay
 * recognisable; that blue is the scoped `--calendar-google` variable, set
 * with a light and a dark value on the calendar page (CALENDAR_SCOPE_CLASS).
 * Values are CSS colors: the event chip mixes them with transparency.
 */
export const LOCAL_EVENT_FALLBACK_COLOR = "var(--muted-foreground)";
export const GOOGLE_EVENT_FALLBACK_COLOR = "var(--calendar-google)";
export const PROJECT_FALLBACK_COLOR = "var(--muted-foreground)";

/** Defines `--calendar-google` (Google's sky blue, lifted a step in dark). */
export const CALENDAR_SCOPE_CLASS =
  "[--calendar-google:oklch(0.588_0.158_241.966)] dark:[--calendar-google:oklch(0.685_0.169_237.323)]";
