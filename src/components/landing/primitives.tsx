import Image from "next/image";
import { cn } from "@/lib/utils";

/** Page frame: centered column with the blueprint rails left and right. */
export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div
        className={cn(
          "mx-auto w-full max-w-[1200px] border-x border-dashed border-line px-5 py-20 sm:px-10 sm:py-28",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** Mono label above a heading: "01 / How it works". */
export function Eyebrow({
  index,
  children,
  className,
}: {
  index?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 font-code text-xs uppercase tracking-[0.12em] text-ink-3",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-ember" aria-hidden="true" />
      {index && <span className="text-ember">{index}</span>}
      {index && <span aria-hidden="true">/</span>}
      {children}
    </p>
  );
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  lede,
  center = false,
}: {
  index?: string;
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div
      className={cn(
        "reveal max-w-[640px]",
        center && "mx-auto text-center [&>p:first-child]:justify-center",
      )}
    >
      <Eyebrow index={index}>{eyebrow}</Eyebrow>
      <h2 className="mt-5 text-balance text-[32px] leading-[1.1] font-medium tracking-[-0.025em] text-ink sm:text-[44px]">
        {title}
      </h2>
      {lede && (
        <p className="mt-5 text-pretty text-base leading-relaxed text-ink-2 sm:text-lg">
          {lede}
        </p>
      )}
    </div>
  );
}

/** Blueprint crosshair squares on the corners of a framed block. */
export function CornerTicks() {
  const tick =
    "pointer-events-none absolute z-10 size-[9px] border border-ink-3/60 bg-paper";
  return (
    <>
      <span aria-hidden="true" className={cn(tick, "-top-[5px] -left-[5px]")} />
      <span
        aria-hidden="true"
        className={cn(tick, "-top-[5px] -right-[5px]")}
      />
      <span
        aria-hidden="true"
        className={cn(tick, "-bottom-[5px] -left-[5px]")}
      />
      <span
        aria-hidden="true"
        className={cn(tick, "-right-[5px] -bottom-[5px]")}
      />
    </>
  );
}

/** Scylla wordmark: dark ink in light mode, light ink in dark mode. */
export function LandingLogo() {
  return (
    <>
      <Image
        src="/images/logo-dark.svg"
        alt="Scylla"
        width={140}
        height={32}
        className="h-6 w-auto dark:hidden"
      />
      <Image
        src="/images/logo.svg"
        alt="Scylla"
        width={140}
        height={32}
        className="hidden h-6 w-auto dark:block"
      />
    </>
  );
}
