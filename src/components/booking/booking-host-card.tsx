"use client";

import * as React from "react";
import { Clock, Video, Building, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HtmlDescriptionViewer } from "@/components/ui/html-description-viewer";

interface BookingHostCardProps {
  host: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  eventType: {
    title?: string | null;
    name: string;
    duration: number;
    description?: string | null;
    requiresRoom?: boolean | null;
  };
}

export function BookingHostCard({ host, eventType }: BookingHostCardProps) {
  const durationText = `${eventType.duration} mins`;
  const locationLabel = eventType.requiresRoom ? "Physical Meeting Room" : "Google Meet Video Call";

  return (
    <div className="flex flex-col gap-5 border-b border-neutral-200/80 bg-neutral-50/50 p-6 lg:border-b-0 lg:border-r dark:border-neutral-800 dark:bg-neutral-900/50">
      {/* Host Avatar & Name */}
      <div className="flex items-center gap-3">
        <Avatar size="lg" className="size-11 ring-2 ring-white dark:ring-neutral-800">
          {host.image && <AvatarImage src={host.image} alt={host.name} />}
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-semibold text-white">
            {host.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Host</span>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{host.name}</h3>
          <p className="text-[11px] text-neutral-400">{host.email}</p>
        </div>
      </div>

      {/* Meeting Title & Metadata */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {eventType.title || eventType.name}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="inline-flex items-center gap-1.5 font-medium">
            <Clock className="size-4 text-orange-500" />
            <span>{durationText}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 font-medium">
            {eventType.requiresRoom ? (
              <Building className="size-4 text-amber-500" />
            ) : (
              <Video className="size-4 text-blue-500" />
            )}
            <span>{locationLabel}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400">
            <Globe className="size-3.5" />
            <span>Asia/Ho_Chi_Minh</span>
          </div>
        </div>
      </div>

      {/* Meeting Description / Agenda */}
      {eventType.description && (
        <div className="mt-1 border-t border-neutral-200/60 pt-4 dark:border-neutral-800">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Meeting Agenda / Details
          </h4>
          <HtmlDescriptionViewer
            html={eventType.description}
            emptyPlaceholder="No agenda notes provided."
          />
        </div>
      )}
    </div>
  );
}
