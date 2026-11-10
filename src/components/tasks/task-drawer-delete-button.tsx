"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface TaskDrawerDeleteButtonProps {
  title: string;
  /** Resolves true when deleted; the drawer closes only then. */
  onDelete: () => Promise<boolean>;
  onDeleted: () => void;
}

export function TaskDrawerDeleteButton({
  title,
  onDelete,
  onDeleted,
}: TaskDrawerDeleteButtonProps) {
  const [confirming, setConfirming] = React.useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 />
        Delete task
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete task?"
        description={`"${title}" will be deleted. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (await onDelete()) onDeleted();
        }}
      />
    </>
  );
}
