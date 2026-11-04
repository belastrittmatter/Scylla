"use client";

import * as React from "react";
import { toast } from "sonner";
import { Calendar, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "cn";
import {
  useCalendarSettings,
  type CalendarViewPreference,
} from "@/hooks/use-calendar-settings";
import { CALENDAR_VIEWS } from "@/components/settings/settings-constants";

export function SettingsCalendarViewCard() {
  const { settings, updateSetting } = useCalendarSettings();

  return (
    <Card className="w-full gap-6 pt-6 pb-0 text-start shadow-xs">
      <CardHeader className="gap-1.5 px-6">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold md:text-xl">
          <Calendar className="size-5 text-muted-foreground" />
          Default Calendar View
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground md:text-sm">
          Choose the view displayed when opening your calendar.
        </CardDescription>
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
                  {isSelected && <Check className="size-3.5 text-primary" />}
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
        <span>Default view applied whenever navigating to the calendar.</span>
      </CardFooter>
    </Card>
  );
}
