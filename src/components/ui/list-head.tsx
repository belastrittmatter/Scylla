import * as React from "react";
import { cn } from "cn";

/**
 * The landing's eyebrow voice for column and list heads: small mono caps, muted.
 * No ember dot here; ember stays reserved for the primary action and active state.
 */
export const listHeadClass =
  "text-muted-foreground font-mono text-[11px] font-normal uppercase tracking-[0.12em]";

/** Column-head bar for a bordered resource list; place it above the `<ul>`. */
export function ListHead({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-head"
      className={cn(
        listHeadClass,
        "bg-muted/30 flex h-9 items-center gap-4 border-b px-4",
        className,
      )}
      {...props}
    />
  );
}
