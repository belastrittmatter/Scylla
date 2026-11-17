import * as React from "react";
import localFont from "next/font/local";

/** Same mono face as the landing, for task metadata (dates, counts, timers, labels). */
const mapleMono = localFont({
  src: [
    {
      path: "../../../fonts/maple-mono-nf-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-maple",
  display: "swap",
});

/**
 * `font-code` resolves through --font-maple, which only the landing defines.
 * The task header controls and the drawer render through portals outside this
 * subtree, so the variable is set on the document while /tasks is mounted
 * (the style element leaves with the route). globals.css stays untouched.
 */
export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`:root{--font-maple:${mapleMono.style.fontFamily};}`}</style>
      {children}
    </>
  );
}
