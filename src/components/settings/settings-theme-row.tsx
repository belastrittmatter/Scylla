"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Sun, Moon, Laptop } from "lucide-react";
import {
  SegmentedControl,
  SettingRow,
  type SegmentedOption,
} from "@/components/settings/settings-primitives";

type ThemeValue = "light" | "dark" | "system";

const THEME_OPTIONS: SegmentedOption<ThemeValue>[] = [
  {
    value: "light",
    label: (
      <>
        <Sun aria-hidden="true" />
        Light
      </>
    ),
  },
  {
    value: "dark",
    label: (
      <>
        <Moon aria-hidden="true" />
        Dark
      </>
    ),
  },
  {
    value: "system",
    label: (
      <>
        <Laptop aria-hidden="true" />
        System
      </>
    ),
  },
];

const emptySubscribe = () => () => {};

export function SettingsThemeRow() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const handleThemeChange = (newTheme: ThemeValue) => {
    setTheme(newTheme);
    toast.success(
      `Theme switched to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode`,
    );
  };

  return (
    <SettingRow
      label="Theme"
      labelId="setting-theme"
      description="System follows your device. Applies right away on every page."
    >
      {mounted ? (
        <SegmentedControl
          value={theme as ThemeValue | undefined}
          options={THEME_OPTIONS}
          onValueChange={handleThemeChange}
          labelledBy="setting-theme"
        />
      ) : (
        <div
          aria-hidden="true"
          className="h-8 w-56 animate-pulse rounded-md bg-muted"
        />
      )}
    </SettingRow>
  );
}
