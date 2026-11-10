"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaskTimelineToolbarProps {
  label: string;
  colW: number;
  onWeek: (dir: 1 | -1) => void;
  onToday: () => void;
  onZoom: (colW: number) => void;
}

export function TaskTimelineToolbar({
  label,
  colW,
  onWeek,
  onToday,
  onZoom,
}: TaskTimelineToolbarProps) {
  return (
    <div className="bg-background flex items-center gap-1 border-b px-5 py-1.5">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Previous week"
        onClick={() => onWeek(-1)}
      >
        <ChevronLeft />
      </Button>
      <Button variant="outline" size="sm" onClick={onToday}>
        Today
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Next week"
        onClick={() => onWeek(1)}
      >
        <ChevronRight />
      </Button>
      <span className="ml-2 text-sm font-medium">{label}</span>
      <Tabs
        value={String(colW)}
        onValueChange={(v) => onZoom(v === "64" ? 64 : 36)}
        className="ml-auto"
      >
        <TabsList aria-label="Timeline zoom">
          <TabsTrigger value="64">2 weeks</TabsTrigger>
          <TabsTrigger value="36">4 weeks</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
