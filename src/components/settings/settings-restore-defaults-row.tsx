"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendarSettings } from "@/hooks/use-calendar-settings";
import { SettingRow } from "@/components/settings/settings-primitives";

export function SettingsRestoreDefaultsRow() {
  const { setTheme } = useTheme();
  const { resetToDefaults } = useCalendarSettings();

  const handleReset = () => {
    resetToDefaults();
    setTheme("system");
    toast.info("Settings reset to defaults");
  };

  return (
    <SettingRow
      label="Restore defaults"
      description="Sets the theme and every calendar preference above back to its default."
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleReset}
        className="gap-1.5 text-xs"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Reset defaults
      </Button>
    </SettingRow>
  );
}
