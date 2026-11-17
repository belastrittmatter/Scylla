import localFont from "next/font/local";

/** Maple Mono for the landing-style eyebrows, scope ids and counts on /consent. */
const mapleMono = localFont({
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

export default function ConsentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${mapleMono.variable} flex flex-1 flex-col`}>
      {children}
    </div>
  );
}
