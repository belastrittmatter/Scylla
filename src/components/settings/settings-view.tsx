"use client";

import * as React from "react";
import {
  SettingsPageHeader,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { SettingsThemeRow } from "@/components/settings/settings-theme-row";
import {
  SettingsDefaultViewRow,
  SettingsNowIndicatorRow,
  SettingsShowWeekendsRow,
  SettingsSlotDurationRow,
  SettingsTimeFormatRow,
  SettingsWeekStartRow,
  SettingsWorkingHoursRow,
} from "@/components/settings/settings-calendar-rows";
import { SettingsRestoreDefaultsRow } from "@/components/settings/settings-restore-defaults-row";

export function SettingsView() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-4 sm:p-6 lg:p-8">
      <SettingsPageHeader
        active="preferences"
        description="Theme, calendar layout, time format and working hours."
      />

      <SettingsSection eyebrow="Appearance">
        <SettingsThemeRow />
      </SettingsSection>

      <SettingsSection
        eyebrow="Calendar"
        description="Saved in this browser and applied to the calendar right away."
      >
        <SettingsDefaultViewRow />
        <SettingsTimeFormatRow />
        <SettingsWeekStartRow />
        <SettingsSlotDurationRow />
        <SettingsWorkingHoursRow />
        <SettingsShowWeekendsRow />
        <SettingsNowIndicatorRow />
      </SettingsSection>

      <SettingsSection eyebrow="Reset">
        <SettingsRestoreDefaultsRow />
      </SettingsSection>
    </div>
  );
}
