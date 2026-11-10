"use client";

import * as React from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { plural } from "@/lib/plural";

interface TaskBulkActionBarProps {
  count: number;
  /** Resolves true when every task was deleted. */
  onDelete: () => Promise<boolean>;
  onClear: () => void;
}

/** Floating bar shown while list rows are selected. */
export function TaskBulkActionBar({
  count,
  onDelete,
  onClear,
}: TaskBulkActionBarProps) {
  const [confirming, setConfirming] = React.useState(false);
  return (
    <>
      <div
        role="toolbar"
        aria-label="Bulk actions"
        className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-popover py-1.5 pl-3 pr-1.5 text-sm text-popover-foreground shadow-lg"
      >
        <span className="tabular-nums">{count} selected</span>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirming(true)}
        >
          <Trash2 />
          Delete
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Clear selection"
          onClick={onClear}
        >
          <X />
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${plural(count, "task")}?`}
        description="This can't be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (await onDelete()) onClear();
        }}
      />
    </>
  );
}
