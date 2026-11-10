"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { slugify } from "@/lib/utils";
import type { ProjectStatus } from "@/services/project/project-types";
import { COLOR_PRESETS } from "./project-settings-types";

interface ProjectGeneralCardProps {
  name: string;
  setName: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  status: ProjectStatus;
  setStatus: (v: ProjectStatus) => void;
  color: string;
  setColor: (v: string) => void;
  isSaving: boolean;
  onSave: (e: React.FormEvent) => Promise<void>;
}

export function ProjectGeneralCard({
  name,
  setName,
  slug,
  setSlug,
  description,
  setDescription,
  status,
  setStatus,
  color,
  setColor,
  isSaving,
  onSave,
}: ProjectGeneralCardProps) {
  return (
    <form onSubmit={onSave}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General Information</CardTitle>
          <CardDescription className="text-xs">
            Basic identification details and visual theme for this project.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="project-name" className="text-xs font-medium">
              Project Name
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug || slug === slugify(name)) {
                  setSlug(slugify(e.target.value));
                }
              }}
              required
              className="h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="project-slug" className="text-xs font-medium">
                Project Slug
              </Label>
              <Input
                id="project-slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="project-status" className="text-xs font-medium">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(val) => val && setStatus(val as ProjectStatus)}
              >
                <SelectTrigger id="project-status" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="project-desc" className="text-xs font-medium">
              Description
            </Label>
            <Textarea
              id="project-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope and goals of this project..."
              className="text-sm"
            />
          </div>

          <div className="space-y-2 pt-1">
            <Label className="text-xs font-medium">Theme Color</Label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-6 rounded-full transition-transform ${
                    color === c
                      ? "scale-110 ring-2 ring-foreground ring-offset-2"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t border-border px-6 py-3">
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="gap-1.5 text-xs h-8"
          >
            <Save className="size-3.5" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
