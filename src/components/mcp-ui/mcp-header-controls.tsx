"use client";

import { MoonIcon, RefreshCwIcon, SunIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface McpHeaderControlsProps {
  readonly isSyncing: boolean;
  readonly onSync: () => void;
}

export function McpHeaderControls({
  isSyncing,
  onSync,
}: McpHeaderControlsProps): React.ReactElement {
  const [isDark, setIsDark] = React.useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  const toggleTheme = (): void => {
    const next = document.documentElement.classList.toggle("dark");
    setIsDark(next);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="icon-xs"
        aria-label="Sync data"
        title="Sync newest data"
        disabled={isSyncing}
        onClick={onSync}
      >
        {isSyncing ? (
          <Spinner className="size-3.5" />
        ) : (
          <RefreshCwIcon className="size-3.5" />
        )}
      </Button>
      <Button
        variant="outline"
        size="icon-xs"
        aria-label="Toggle theme"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggleTheme}
      >
        {isDark ? (
          <SunIcon className="size-3.5" />
        ) : (
          <MoonIcon className="size-3.5" />
        )}
      </Button>
    </div>
  );
}
