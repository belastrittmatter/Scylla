import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConnectedAccountRowProps {
  providerName: string;
  icon: React.ReactNode;
  connectedText: string;
  isConnected: boolean;
  canUnlink: boolean;
  isBusy: boolean;
  disabled?: boolean;
  onLink: () => void;
  onUnlink: () => void;
}

export function ConnectedAccountRow({
  providerName,
  icon,
  connectedText,
  isConnected,
  canUnlink,
  isBusy,
  disabled = false,
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
          <span className="text-xs text-muted-foreground">
            {isConnected ? connectedText : "Not connected"}
          </span>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant={isConnected ? "outline" : "default"}
        disabled={isBusy || disabled || (isConnected && !canUnlink)}
        onClick={isConnected ? onUnlink : onLink}
        className="gap-1.5 text-xs"
      >
        {isBusy && <Loader2 className="size-3.5 animate-spin" />}
        {isConnected ? "Unlink" : "Link"}
      </Button>
    </div>
  );
}
