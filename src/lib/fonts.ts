import localFont from "next/font/local";

/**
 * Maple Mono NF (Italic + Regular): the mono "code" face for eyebrows, IDs,
 * counts, times and keyboard hints. Globals map `font-code` to
 * `var(--font-maple)`, so any subtree that should render it carries
 * `mapleMono.variable` on an ancestor.
 */
export const mapleMono = localFont({
  src: [
    {
      path: "../fonts/maple-mono-nf-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/maple-mono-nf-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-maple",
  display: "swap",
});
