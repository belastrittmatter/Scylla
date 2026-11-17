import localFont from "next/font/local";

/**
 * Maple Mono, the landing's code face, for the settings routes. It defines
 * `--font-maple`, which the global `font-code` utility reads. Loaded from the
 * settings layouts (not the views) so unit tests can render the views directly.
 */
export const settingsMonoFont = localFont({
  src: [
    {
      path: "../../fonts/maple-mono-nf-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-maple",
  display: "swap",
});
