"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface CalendarCancelPromptProps {
  isDeleting: boolean;
  cancelTarget: "single" | "series" | null;
  onCancelSingle: () => void;
  onCancelSeries: () => void;
  onDismiss: () => void;
}

export function CalendarCancelPrompt({
  isDeleting,
  cancelTarget,
  onCancelSingle,
  onCancelSeries,
  onDismiss,
}: CalendarCancelPromptProps) {
  return (
    <div className="w-full space-y-2.5 rounded-xl border border-red-200/80 bg-red-50/60 p-3 text-left dark:border-red-950/60 dark:bg-red-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-900 dark:text-red-200">
          <AlertTriangle className="size-3.5 text-red-600 dark:text-red-400" />
          <span>Cancel Recurring Meeting</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDeleting}
          onClick={onDismiss}
          className="h-6 px-2 text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          Keep
        </Button>
      </div>

      <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
        This meeting repeats. Cancel only this occurrence or all events in this
        series?
      </p>

      <div className="flex items-center gap-2 pt-0.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDeleting}
          onClick={onCancelSingle}
          className="h-8 flex-1 cursor-pointer gap-1 text-xs"
        >
          {isDeleting && cancelTarget === "single" ? (
            <Loader2 className="size-3 animate-spin mr-1" />
          ) : null}
          This event only
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isDeleting}
          onClick={onCancelSeries}
          className="h-8 flex-1 cursor-pointer gap-1 bg-red-600 text-xs text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
        >
          {isDeleting && cancelTarget === "series" ? (
            <Loader2 className="size-3 animate-spin mr-1" />
          ) : null}
          All events in series
        </Button>
      </div>
    </div>
  );
}
