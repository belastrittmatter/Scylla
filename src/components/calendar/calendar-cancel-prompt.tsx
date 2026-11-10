"use client";

import * as React from "react";
import { Alert } from "@/components/ui/alert";
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
    <Alert variant="destructive" className="space-y-2.5 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <AlertTriangle className="size-3.5" />
          <span>Cancel Recurring Meeting</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDeleting}
          onClick={onDismiss}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Keep
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
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
          className="h-8 flex-1 cursor-pointer gap-1 text-xs"
        >
          {isDeleting && cancelTarget === "series" ? (
            <Loader2 className="size-3 animate-spin mr-1" />
          ) : null}
          All events in series
        </Button>
      </div>
    </Alert>
  );
}
