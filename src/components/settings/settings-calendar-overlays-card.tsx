"use client";

import * as React from "react";
import { toast } from "sonner";
import { Layers } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCalendarSettings } from "@/hooks/use-calendar-settings";

export function SettingsCalendarOverlaysCard() {
  const { settings, updateSetting } = useCalendarSettings();

  return (
    <Card className="w-full gap-6 pt-6 pb-0 text-start shadow-xs">
      <CardHeader className="gap-1.5 px-6">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold md:text-xl">
          <Layers className="size-5 text-muted-foreground" />
          Calendar Overlays
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground md:text-sm">
          Toggle visibility of weekend days and real-time indicators.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3.5">
          <div className="space-y-0.5">
            <Label htmlFor="show-weekends" className="text-sm font-medium">
              Show Weekends
            </Label>
            <p className="text-xs text-muted-foreground">
              Display Saturday and Sunday columns on week and month views.
            </p>
          </div>
          <Switch
            id="show-weekends"
            checked={settings.showWeekends}
            onCheckedChange={(checked) => {
              updateSetting("showWeekends", checked);
              toast.success(checked ? "Weekends displayed" : "Weekends hidden");
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-3.5">
          <div className="space-y-0.5">
            <Label htmlFor="show-now" className="text-sm font-medium">
              Current Time Indicator
            </Label>
            <p className="text-xs text-muted-foreground">
              Renders a real-time line indicator on today&apos;s schedule grid.
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
  );
}
