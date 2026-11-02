"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  RotateCcw,
  ArrowRight,
  Sun,
  Moon,
  Laptop,
  Check,
  Calendar,
  Clock,
  Briefcase,
  Layers,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "cn";
import {
  useCalendarSettings,
  workingHoursSchema,
  type CalendarViewPreference,
} from "@/hooks/use-calendar-settings";
import {
  CALENDAR_VIEWS,
  START_HOURS,
  END_HOURS,
  SLOT_DURATIONS,
} from "@/components/settings/settings-constants";

const emptySubscribe = () => () => {};

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const { settings, updateSetting, resetToDefaults } = useCalendarSettings();

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    toast.success(
      `Theme switched to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode`,
    );
  };

  const handleReset = () => {
    resetToDefaults();
    setTheme("system");
    toast.info("Settings reset to defaults");
  };

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

  const currentStartHourLabel =
    START_HOURS.find((h) => h.value === settings.dayStartHour)?.label ||
    `${settings.dayStartHour}:00`;
  const currentEndHourLabel =
    END_HOURS.find((h) => h.value === settings.dayEndHour)?.label ||
    `${settings.dayEndHour}:00`;

  return (
    <div className="mx-auto max-w-4xl space-y-10 p-4 sm:p-6 lg:p-8">
      {/* Header with Title, Description, and Navigation matching Account Settings */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Calendar & Display Preferences
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Customize your schedule presentation, grid boundaries, active hours,
            and theme.
          </p>
        </div>

        <Link
          href="/account/settings"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1.5 border-neutral-200 text-xs text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
          )}
        >
          Account Settings
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="space-y-8">
        {/* Appearance Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Appearance
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Choose how Scylla looks on your screen. Supports automatic
              synchronization with your system settings.
            </p>
          </div>

          <Card className="w-full pb-0 text-start shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  Interface Theme
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Select your preferred visual theme for the Scylla interface.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {mounted ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    {
                      id: "light" as const,
                      label: "Light",
                      icon: Sun,
                      desc: "Crisp high-contrast layout",
                    },
                    {
                      id: "dark" as const,
                      label: "Dark",
                      icon: Moon,
                      desc: "Easy on the eyes in low light",
                    },
                    {
                      id: "system" as const,
                      label: "System",
                      icon: Laptop,
                      desc: "Matches your OS preference",
                    },
                  ].map(({ id, label, icon: Icon, desc }) => {
                    const isSelected = theme === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleThemeChange(id)}
                        className={cn(
                          "relative flex flex-col items-start gap-1 rounded-lg border p-3.5 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary text-foreground"
                            : "border-border hover:bg-accent/50 text-muted-foreground",
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Icon className="size-4" />
                            <span>{label}</span>
                          </div>
                          {isSelected && (
                            <Check className="size-4 text-primary" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="h-20 animate-pulse rounded-lg bg-muted" />
              )}
            </CardContent>
            <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
              <span>
                Theme applies immediately across all pages and components.
              </span>
            </CardFooter>
          </Card>
        </section>

        {/* Calendar Display Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Calendar Display
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Configure grid layouts, time formats, working hours, and overlays.
            </p>
          </div>

          <div className="space-y-4">
            {/* Default Calendar View Card */}
            <Card className="w-full pb-0 text-start shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">
                      Default Calendar View
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Choose the view displayed when opening your calendar.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {CALENDAR_VIEWS.map((view) => {
                    const isSelected = settings.defaultView === view.id;
                    return (
                      <button
                        key={view.id}
                        type="button"
                        onClick={() => {
                          updateSetting(
                            "defaultView",
                            view.id as CalendarViewPreference,
                          );
                          toast.success(`Default view set to ${view.title}`);
                        }}
                        className={cn(
                          "relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary text-foreground"
                            : "border-border hover:bg-accent/50 text-muted-foreground",
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {view.title}
                          </span>
                          {isSelected && (
                            <Check className="size-3.5 text-primary" />
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {view.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
                <span>
                  Default view applied whenever navigating to the calendar.
                </span>
              </CardFooter>
            </Card>

            {/* Date & Time Formatting Card */}
            <Card className="w-full pb-0 text-start shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">
                      Date & Time Formatting
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Configure time notation, week start day, and grid intervals.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 px-6 pb-6">
                {/* Time Display Format */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Time Display Format
                  </Label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {[
                      {
                        id: "12h" as const,
                        label: "12-Hour",
                        desc: "e.g. 2:30 PM (AM/PM)",
                      },
                      {
                        id: "24h" as const,
                        label: "24-Hour",
                        desc: "e.g. 14:30 (Military / ISO)",
                      },
                    ].map((fmt) => {
                      const isSelected = settings.timeFormat === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => {
                            updateSetting("timeFormat", fmt.id);
                            toast.success(`${fmt.label} format enabled`);
                          }}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:bg-accent/50",
                          )}
                        >
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {fmt.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {fmt.desc}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="size-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* First Day of the Week */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    First Day of the Week
                  </Label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {[
                      {
                        id: 1 as const,
                        label: "Monday",
                        desc: "Standard European / ISO week",
                      },
                      {
                        id: 0 as const,
                        label: "Sunday",
                        desc: "Standard US / traditional week",
                      },
                    ].map((day) => {
                      const isSelected = settings.weekStartsOn === day.id;
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            updateSetting("weekStartsOn", day.id);
                            toast.success(`Week starts on ${day.label}`);
                          }}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:bg-accent/50",
                          )}
                        >
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {day.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {day.desc}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="size-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grid Slot Duration */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Grid Slot Resolution
                  </Label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {SLOT_DURATIONS.map((slot) => {
                      const isSelected = settings.slotDuration === slot.value;
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => {
                            updateSetting(
                              "slotDuration",
                              slot.value as 15 | 30 | 60,
                            );
                            toast.success(`Slot resolution: ${slot.label}`);
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary font-semibold text-primary"
                              : "border-border hover:bg-accent/50 text-foreground",
                          )}
                        >
                          <span className="text-sm">{slot.label}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {slot.value === 15
                              ? "High detail"
                              : slot.value === 30
                                ? "Standard"
                                : "Compact"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
                <span>
                  Applied immediately to the calendar gutter, event cards, and
                  time indicators.
                </span>
              </CardFooter>
            </Card>

            {/* Working Hours Window Card */}
            <Card className="w-full pb-0 text-start shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">
                      Working Hours Window
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Set your schedule boundaries for availability planning.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="day-start"
                      className="text-xs text-muted-foreground"
                    >
                      Day Starts At
                    </Label>
                    <Select
                      value={String(settings.dayStartHour)}
                      onValueChange={handleStartHourChange}
                    >
                      <SelectTrigger id="day-start" className="w-full">
                        <SelectValue>{currentStartHourLabel}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {START_HOURS.map((h) => (
                          <SelectItem key={h.value} value={String(h.value)}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="day-end"
                      className="text-xs text-muted-foreground"
                    >
                      Day Ends At
                    </Label>
                    <Select
                      value={String(settings.dayEndHour)}
                      onValueChange={handleEndHourChange}
                    >
                      <SelectTrigger id="day-end" className="w-full">
                        <SelectValue>{currentEndHourLabel}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {END_HOURS.map((h) => (
                          <SelectItem key={h.value} value={String(h.value)}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
                <span>
                  Validated with Zod: Start hour must be strictly before end
                  hour.
                </span>
              </CardFooter>
            </Card>

            {/* Calendar Overlays Card */}
            <Card className="w-full pb-0 text-start shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">
                      Calendar Overlays
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Toggle visibility of weekend days and real-time indicators.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3.5">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="show-weekends"
                      className="text-sm font-medium"
                    >
                      Show Weekends
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Display Saturday and Sunday columns on week and month
                      views.
                    </p>
                  </div>
                  <Switch
                    id="show-weekends"
                    checked={settings.showWeekends}
                    onCheckedChange={(checked) => {
                      updateSetting("showWeekends", checked);
                      toast.success(
                        checked ? "Weekends displayed" : "Weekends hidden",
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-3.5">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-now" className="text-sm font-medium">
                      Current Time Indicator
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Renders a real-time line indicator on today&apos;s
                      schedule grid.
                    </p>
                  </div>
                  <Switch
                    id="show-now"
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
                </div>
              </CardContent>
              <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
                <span>Overlays update dynamically without page reloading.</span>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Reset Preferences Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Reset Preferences
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Restore all calendar display preferences and theme to system
              defaults.
            </p>
          </div>

          <Card className="w-full pb-0 text-start shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  Restore Defaults
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Reset view mode, working hours, theme, and grid increments
                  back to default.
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="flex items-center justify-between rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
              <span>
                This action only resets local presentation preferences.
              </span>
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
        </section>
      </div>
    </div>
  );
}
