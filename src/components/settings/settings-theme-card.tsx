"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "cn";

const emptySubscribe = () => () => {};

export function SettingsThemeCard() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    toast.success(
      `Theme switched to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode`,
    );
  };

  return (
    <Card className="w-full gap-6 pt-6 pb-0 text-start shadow-xs">
      <CardHeader className="gap-1.5 px-6">
        <CardTitle className="text-lg font-semibold md:text-xl">
          Interface Theme
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground md:text-sm">
          Select your preferred visual theme for the Scylla interface.
        </CardDescription>
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
                    {isSelected && <Check className="size-4 text-primary" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        )}
      </CardContent>
      <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
        <span>Theme applies immediately across all pages and components.</span>
      </CardFooter>
    </Card>
  );
}
