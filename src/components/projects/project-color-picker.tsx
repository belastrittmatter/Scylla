"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";

export const PRESET_COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
];

export interface ProjectColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
}

export function ProjectColorPicker({
  color,
  onColorChange,
}: ProjectColorPickerProps) {
  return (
    <div className="grid gap-1.5">
      <Label>Theme Color</Label>
      <div className="flex items-center gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`size-6 rounded-full transition-transform ${
              color === c
                ? "scale-110 ring-2 ring-neutral-900 ring-offset-2 dark:ring-neutral-100"
                : "opacity-80 hover:opacity-100"
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onColorChange(c)}
          />
        ))}
      </div>
    </div>
  );
}
