"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ConnectedAccountRowProps {
  providerName: string;
  icon: React.ReactNode;
  isLoading: boolean;
  isConnected: boolean;
  connectedText: string;
  canUnlink: boolean;
  isBusy: boolean;
  onLink: () => void;
  onUnlink: () => void;
}

export function ConnectedAccountRow({
  providerName,
  icon,
  isLoading,
  isConnected,
  connectedText,
  canUnlink,
  isBusy,
  onLink,
  onUnlink,
}: ConnectedAccountRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg border bg-background shadow-2xs">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{providerName}</span>
          {isLoading ? (
            <Skeleton className="mt-1 h-3 w-36" />
          ) : (
            <span className="text-xs text-muted-foreground">
              {isConnected ? connectedText : "Not connected"}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <Button
          type="button"
          size="sm"
          variant={isConnected ? "outline" : "default"}
          disabled={isBusy || (isConnected && !canUnlink)}
          onClick={isConnected ? onUnlink : onLink}
          className="gap-1.5 text-xs"
        >
          {isBusy && <Loader2 className="size-3.5 animate-spin" />}
          {isConnected ? "Unlink" : "Link"}
        </Button>
      )}
    </div>
  );
}
