"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCalendarSettings } from "@/hooks/use-calendar-settings";

export function SettingsRestoreDefaultsCard() {
  const { setTheme } = useTheme();
  const { resetToDefaults } = useCalendarSettings();

  const handleReset = () => {
    resetToDefaults();
    setTheme("system");
    toast.info("Settings reset to defaults");
  };

  return (
    <Card className="w-full gap-6 pt-6 pb-0 text-start shadow-xs">
      <CardHeader className="gap-1.5 px-6">
        <CardTitle className="text-lg font-semibold md:text-xl">
          Restore Defaults
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground md:text-sm">
          Reset view mode, working hours, theme, and grid increments back to
          default.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-between rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
        <span>This action only resets local presentation preferences.</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"
        >
          <RotateCcw className="size-3.5" />
          Reset Defaults
        </Button>
      </CardFooter>
    </Card>
  );
}
