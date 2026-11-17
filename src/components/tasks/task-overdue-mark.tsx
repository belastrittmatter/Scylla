import { cn } from "@/lib/utils";

/**
 * Non-color overdue cue for a due date (WCAG 1.4.1): a quiet mono word after
 * the date. `collapse` keeps it for screen readers only below sm, where the
 * list's due column is too narrow for the word.
 */
export function OverdueMark({ collapse = false }: { collapse?: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={cn("uppercase tracking-[0.08em]", collapse && "max-sm:hidden")}
      >
        · overdue
      </span>
      <span className="sr-only">, overdue</span>
    </>
  );
}
