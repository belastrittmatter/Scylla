"use client";

import * as React from "react";
import {
  getDayIndexAtX,
  getDragCreateDates,
  getDragDayRange,
} from "./task-timeline";

interface UseTimelineDragCreateArgs {
  colW: number;
  days: number;
  rangeStart: Date;
  onCreateRange?: (startDate: Date, dueDate: Date) => void;
}

type DayRange = { first: number; last: number };

interface DragState {
  anchor: number;
  current: number;
  active: boolean;
}

export interface TimelineDragHandlers {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: () => void;
  onClickCapture: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const dayAt = (
  e: React.PointerEvent<HTMLDivElement>,
  colW: number,
  days: number,
) =>
  getDayIndexAtX(
    e.clientX - e.currentTarget.getBoundingClientRect().left,
    colW,
    days,
  );

/**
 * Drag on empty day-grid space to pick a day range for a new task.
 * The drag only activates once the pointer crosses into another day column,
 * so same-column clicks still reach the row underneath.
 */
export function useTimelineDragCreate({
  colW,
  days,
  rangeStart,
  onCreateRange,
}: UseTimelineDragCreateArgs): {
  range: DayRange | null;
  handlers: TimelineDragHandlers | undefined;
} {
  const [drag, setDrag] = React.useState<DragState | null>(null);
  const suppressClick = React.useRef(false);

  const range =
    drag && drag.active ? getDragDayRange(drag.anchor, drag.current) : null;

  if (!onCreateRange) return { range: null, handlers: undefined };

  const handlers: TimelineDragHandlers = {
    onPointerDown: (e) => {
      // A drag whose click never arrived must not swallow this new click.
      suppressClick.current = false;
      if (e.button !== 0 || !e.isPrimary) return;
      if ((e.target as Element).closest("[data-timeline-bar]")) return;
      const idx = dayAt(e, colW, days);
      setDrag({ anchor: idx, current: idx, active: false });
    },
    onPointerMove: (e) => {
      if (!drag) return;
      // Button released outside the grid: drop the stale pending drag.
      if (!(e.buttons & 1)) return setDrag(null);
      const idx = dayAt(e, colW, days);
      // Pending drags keep current === anchor, so this also waits for a column change.
      if (idx === drag.current) return;
      if (!drag.active) e.currentTarget.setPointerCapture(e.pointerId);
      setDrag({ anchor: drag.anchor, current: idx, active: true });
    },
    onPointerUp: (e) => {
      if (!drag) return;
      setDrag(null);
      if (!drag.active) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      const { first, last } = getDragDayRange(
        drag.anchor,
        dayAt(e, colW, days),
      );
      suppressClick.current = true;
      const { startDate, dueDate } = getDragCreateDates(
        rangeStart,
        first,
        last,
      );
      onCreateRange(startDate, dueDate);
    },
    onPointerCancel: () => setDrag(null),
    onClickCapture: (e) => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      e.stopPropagation();
    },
  };

  return { range, handlers };
}
