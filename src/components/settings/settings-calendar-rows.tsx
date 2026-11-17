"use client";

import * as React from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCalendarSettings,
  workingHoursSchema,
} from "@/hooks/use-calendar-settings";
import {
  CALENDAR_VIEWS,
  END_HOURS,
  SLOT_DURATIONS,
  START_HOURS,
  formatHourLabel,
} from "@/components/settings/settings-constants";
import {
  SegmentedControl,
  SettingRow,
} from "@/components/settings/settings-primitives";

const TIME_FORMATS = [
  { value: "12h" as const, label: "12-hour", toast: "12-Hour" },
  { value: "24h" as const, label: "24-hour", toast: "24-Hour" },
];

const WEEK_STARTS = [
  { value: 1 as const, label: "Monday" },
  { value: 0 as const, label: "Sunday" },
];

export function SettingsDefaultViewRow() {
  const { settings, updateSetting } = useCalendarSettings();

  return (
    <SettingRow
      label="Default view"
      labelId="setting-default-view"
      description="Opens when you go to the calendar."
    >
      <SegmentedControl
        value={settings.defaultView}
        options={CALENDAR_VIEWS.map((view) => ({
          value: view.id,
          label: view.title,
        }))}
        onValueChange={(next) => {
          const view = CALENDAR_VIEWS.find((v) => v.id === next);
          updateSetting("defaultView", next);
          toast.success(`Default view set to ${view?.title ?? next}`);
        }}
        labelledBy="setting-default-view"
      />
    </SettingRow>
  );
}

export function SettingsTimeFormatRow() {
  const { settings, updateSetting } = useCalendarSettings();

  return (
    <SettingRow
      label="Time format"
      labelId="setting-time-format"
      descriptionId="setting-time-format-help"
      description={
        <>
          Shows times as <span className="font-mono">2:30 PM</span> or{" "}
          <span className="font-mono">14:30</span>.
        </>
      }
    >
      <SegmentedControl
        value={settings.timeFormat}
        options={TIME_FORMATS}
        onValueChange={(next) => {
          const fmt = TIME_FORMATS.find((f) => f.value === next);
          updateSetting("timeFormat", next);
          toast.success(`${fmt?.toast ?? next} format enabled`);
        }}
        labelledBy="setting-time-format"
        describedBy="setting-time-format-help"
      />
    </SettingRow>
  );
}

export function SettingsWeekStartRow() {
  const { settings, updateSetting } = useCalendarSettings();

  return (
    <SettingRow
      label="Week starts on"
      labelId="setting-week-start"
      description="The first day in week and month views."
    >
      <SegmentedControl
        value={settings.weekStartsOn}
        options={WEEK_STARTS}
        onValueChange={(next) => {
          const day = WEEK_STARTS.find((d) => d.value === next);
          updateSetting("weekStartsOn", next);
          toast.success(`Week starts on ${day?.label ?? next}`);
        }}
        labelledBy="setting-week-start"
      />
    </SettingRow>
  );
}

export function SettingsSlotDurationRow() {
  const { settings, updateSetting } = useCalendarSettings();

  return (
    <SettingRow
      label="Grid slots"
      labelId="setting-slot-duration"
      description="Length of one row in the time grid. Shorter slots show more detail."
    >
      <SegmentedControl
        mono
        value={settings.slotDuration}
        options={SLOT_DURATIONS.map((slot) => ({
          value: slot.value,
          label: slot.short,
          ariaLabel: `${slot.short}, ${slot.label}`,
        }))}
        onValueChange={(next) => {
          const slot = SLOT_DURATIONS.find((s) => s.value === next);
          updateSetting("slotDuration", next);
          toast.success(`Slot resolution: ${slot?.label ?? next}`);
        }}
        labelledBy="setting-slot-duration"
      />
    </SettingRow>
  );
}

export function SettingsWorkingHoursRow() {
  const { settings, updateSetting } = useCalendarSettings();
  const fmt = settings.timeFormat;

  const handleStartHourChange = (val: string | null) => {
    if (!val) return;
    const hour = Number(val);
    const parsed = workingHoursSchema.safeParse({
      dayStartHour: hour,
      dayEndHour: settings.dayEndHour,
    });
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message || "Start hour must be before end hour",
      );
      return;
    }
    updateSetting("dayStartHour", hour);
    toast.success("Start hour updated");
  };

  const handleEndHourChange = (val: string | null) => {
    if (!val) return;
    const hour = Number(val);
    const parsed = workingHoursSchema.safeParse({
      dayStartHour: settings.dayStartHour,
      dayEndHour: hour,
    });
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message || "End hour must be after start hour",
      );
      return;
    }
    updateSetting("dayEndHour", hour);
    toast.success("End hour updated");
  };

  const triggerClass = "w-28 font-mono text-xs";

  return (
    <SettingRow
      label="Working hours"
      labelId="setting-working-hours"
      descriptionId="setting-working-hours-help"
      description="The hours the calendar grid shows. Start must be before end."
    >
      <div
        role="group"
        aria-labelledby="setting-working-hours"
        aria-describedby="setting-working-hours-help"
        className="flex items-center gap-2"
      >
        <label htmlFor="day-start" className="sr-only">
          Day starts at
        </label>
        <Select
          value={String(settings.dayStartHour)}
          onValueChange={handleStartHourChange}
        >
          <SelectTrigger id="day-start" className={triggerClass}>
            <SelectValue>{formatHourLabel(settings.dayStartHour, fmt)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {START_HOURS.map((hour) => (
              <SelectItem
                key={hour}
                value={String(hour)}
                className="font-mono text-xs"
              >
                {formatHourLabel(hour, fmt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span aria-hidden="true" className="text-xs text-muted-foreground">
          to
        </span>

        <label htmlFor="day-end" className="sr-only">
          Day ends at
        </label>
        <Select
          value={String(settings.dayEndHour)}
          onValueChange={handleEndHourChange}
        >
          <SelectTrigger id="day-end" className={triggerClass}>
            <SelectValue>{formatHourLabel(settings.dayEndHour, fmt)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {END_HOURS.map((hour) => (
              <SelectItem
                key={hour}
                value={String(hour)}
                className="font-mono text-xs"
              >
                {formatHourLabel(hour, fmt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </SettingRow>
  );
}

export function SettingsShowWeekendsRow() {
  const { settings, updateSetting } = useCalendarSettings();

  return (
    <SettingRow
      inline
      label="Show weekends"
      htmlFor="show-weekends"
      descriptionId="show-weekends-help"
      description="Saturday and Sunday columns in week and month views."
    >
      <Switch
        id="show-weekends"
        aria-describedby="show-weekends-help"
        checked={settings.showWeekends}
        onCheckedChange={(checked) => {
          updateSetting("showWeekends", checked);
          toast.success(checked ? "Weekends displayed" : "Weekends hidden");
        }}
      />
    </SettingRow>
  );
}

export function SettingsNowIndicatorRow() {
  const { settings, updateSetting } = useCalendarSettings();

  return (
    <SettingRow
      inline
      label="Current time indicator"
      htmlFor="show-now"
      descriptionId="show-now-help"
      description="A line marking the current time on today's grid."
    >
      <Switch
        id="show-now"
        aria-describedby="show-now-help"
        checked={settings.showNowIndicator}
        onCheckedChange={(checked) => {
          updateSetting("showNowIndicator", checked);
          toast.success(
            checked
              ? "Current time indicator enabled"
              : "Current time indicator disabled",
          );
        }}
      />
    </SettingRow>
  );
}
