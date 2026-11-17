import { mapleMono } from "@/fonts/maple";

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
