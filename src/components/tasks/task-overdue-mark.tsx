/**
 * Non-color overdue cue for a due date (WCAG 1.4.1): a quiet mono word after
 * the date, shared by the board, list and timeline. Render it inside a gapped
 * inline-flex next to the date.
 */
export function OverdueMark() {
  return (
    <>
      <span aria-hidden="true" className="uppercase tracking-[0.08em]">
        · overdue
      </span>
      <span className="sr-only">, overdue</span>
    </>
  );
}
