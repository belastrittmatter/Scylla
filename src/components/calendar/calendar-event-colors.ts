/**
 * Fallback event tints for when the API sends no color.
 *
 * Ember is reserved for the primary action, the active state and "now", so a
 * local event without its own color takes the neutral muted tone. Synced Google
 * events keep Google Calendar's own blue so they stay recognisable.
 * Values are CSS colors: the event chip mixes them with transparency.
 */
export const LOCAL_EVENT_FALLBACK_COLOR = "var(--muted-foreground)";
export const GOOGLE_EVENT_FALLBACK_COLOR = "#0284c7";
