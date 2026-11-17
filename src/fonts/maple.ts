import localFont from "next/font/local";

/**
 * Maple Mono NF (Regular + Italic) as `--font-maple`, the face behind the
 * `font-code` utility: eyebrows, ids, counts and terminal accents. Shared by
 * every layout that renders landing-style surfaces so there is one
 * @font-face family to keep in sync.
 */
export const mapleMono = localFont({
  src: [
    {
      path: "./maple-mono-nf-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./maple-mono-nf-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-maple",
  display: "swap",
});
